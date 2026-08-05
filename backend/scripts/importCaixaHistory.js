"use strict";

import fs from "node:fs";
import path from "node:path";

import {
  getLotteryDefinition,
  LOTTERY_KEYS,
} from "../domain/lotteryCatalog.js";

import {
  normalizeCaixaResult,
} from "../domain/normalizeCaixaResult.js";

import {
  fetchCaixaContest,
  fetchLatestCaixaResult,
} from "../services/caixaLotteryClient.js";

import {
  saveOfficialLotteryResult,
} from "../repositories/lotteryResultRepository.js";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_DELAY_MS = 250;
const DEFAULT_RETRIES = 3;

function readArgument(name) {
  const prefix = `--${name}=`;

  const argument = process.argv.find(
    (value) => value.startsWith(prefix),
  );

  return argument
    ? argument.slice(prefix.length).trim()
    : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function positiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0
    ? number
    : fallback;
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number >= 0
    ? number
    : fallback;
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function resolveLotteries(value) {
  const requested = String(value || "all")
    .trim()
    .toLowerCase();

  if (requested === "all") {
    return [...LOTTERY_KEYS];
  }

  const keys = requested
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const key of keys) {
    getLotteryDefinition(key);
  }

  return keys;
}

function checkpointPath(lotteryKey) {
  return path.resolve(
    "tmp",
    `caixa_history_checkpoint_${lotteryKey}.json`,
  );
}

function readCheckpoint(lotteryKey) {
  const file = checkpointPath(lotteryKey);

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8"),
    );
  } catch {
    throw new Error(
      `Checkpoint inválido: ${file}`,
    );
  }
}

function writeCheckpoint(lotteryKey, data) {
  const file = checkpointPath(lotteryKey);

  fs.mkdirSync(
    path.dirname(file),
    { recursive: true },
  );

  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        lotteryKey,
        ...data,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

async function fetchWithRetry({
  lottery,
  contest,
  retries,
}) {
  let lastError;

  for (
    let attempt = 1;
    attempt <= retries;
    attempt += 1
  ) {
    try {
      return await fetchCaixaContest(
        lottery,
        contest,
      );
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        const delay = attempt * 750;

        console.warn(
          `[RETRY] ${lottery.name} ` +
          `concurso=${contest} ` +
          `tentativa=${attempt}/${retries}`,
        );

        await sleep(delay);
      }
    }
  }

  throw lastError;
}

async function resolveLatestContest(lottery) {
  const raw = await fetchLatestCaixaResult(
    lottery,
  );

  const contest = Number(raw?.numero);

  if (
    !Number.isInteger(contest) ||
    contest <= 0
  ) {
    throw new Error(
      `${lottery.name}: último concurso inválido.`,
    );
  }

  return contest;
}

async function importLottery({
  lotteryKey,
  shouldWrite,
  pilotCount,
  startArgument,
  endArgument,
  batchSize,
  delayMs,
  retries,
  resume,
}) {
  const lottery =
    getLotteryDefinition(lotteryKey);

  const latestContest =
    await resolveLatestContest(lottery);

  let startContest =
    positiveInteger(startArgument, 0);

  let endContest =
    positiveInteger(
      endArgument,
      latestContest,
    );

  if (pilotCount > 0) {
    endContest = latestContest;

    startContest = Math.max(
      1,
      latestContest - pilotCount + 1,
    );
  }

  if (resume && shouldWrite) {
    const checkpoint =
      readCheckpoint(lotteryKey);

    if (
      checkpoint &&
      Number(checkpoint.nextContest) >
        startContest
    ) {
      startContest =
        Number(checkpoint.nextContest);
    }
  }

  if (startContest > endContest) {
    return {
      lotteryKey,
      lotteryName: lottery.name,
      startContest,
      endContest,
      latestContest,
      processed: 0,
      created: 0,
      protected: 0,
      validated: 0,
      failed: 0,
      failures: [],
    };
  }

  const summary = {
    lotteryKey,
    lotteryName: lottery.name,
    startContest,
    endContest,
    latestContest,
    processed: 0,
    created: 0,
    protected: 0,
    validated: 0,
    failed: 0,
    failures: [],
  };

  for (
    let contest = startContest;
    contest <= endContest;
    contest += 1
  ) {
    try {
      const raw = await fetchWithRetry({
        lottery,
        contest,
        retries,
      });

      const normalized =
        normalizeCaixaResult({
          raw,
          lottery,
          fetchedAt: new Date(),
        });

      if (shouldWrite) {
        const persistence =
          await saveOfficialLotteryResult(
            normalized,
          );

        if (persistence.created) {
          summary.created += 1;
        }
        else {
          summary.protected += 1;
        }

        writeCheckpoint(
          lotteryKey,
          {
            lastProcessedContest: contest,
            nextContest: contest + 1,
            endContest,
            completed:
              contest === endContest,
          },
        );
      }
      else {
        summary.validated += 1;
      }

      summary.processed += 1;

      console.log(
        `[OK] ${lottery.name} ` +
        `concurso=${contest} ` +
        `modo=${shouldWrite ? "write" : "dry-run"}`,
      );
    } catch (error) {
      summary.failed += 1;

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      summary.failures.push({
        contest,
        error: message,
      });

      console.error(
        `[ERRO] ${lottery.name} ` +
        `concurso=${contest}: ${message}`,
      );
    }

    if (
      contest < endContest &&
      delayMs > 0
    ) {
      await sleep(delayMs);
    }

    const processedInBatch =
      contest - startContest + 1;

    if (
      processedInBatch % batchSize === 0
    ) {
      console.log(
        `[LOTE] ${lottery.name} ` +
        `processados=${processedInBatch}`,
      );
    }
  }

  return summary;
}

async function main() {
  const shouldWrite = hasFlag("write");
  const resume = hasFlag("resume");

  const lotteryKeys = resolveLotteries(
    readArgument("lottery"),
  );

  const pilotCount =
    nonNegativeInteger(
      readArgument("pilot"),
      0,
    );

  const startArgument =
    readArgument("start");

  const endArgument =
    readArgument("end");

  const batchSize =
    positiveInteger(
      readArgument("batch-size"),
      DEFAULT_BATCH_SIZE,
    );

  const delayMs =
    nonNegativeInteger(
      readArgument("delay-ms"),
      DEFAULT_DELAY_MS,
    );

  const retries =
    positiveInteger(
      readArgument("retries"),
      DEFAULT_RETRIES,
    );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "PALPITACO LOTERIAS — CAIXA HISTORICAL IMPORTER V1",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    `Modo........: ${shouldWrite ? "WRITE" : "DRY-RUN"}`,
  );
  console.log(
    `Modalidades.: ${lotteryKeys.join(", ")}`,
  );
  console.log(
    `Pilot.......: ${pilotCount || "desativado"}`,
  );
  console.log(
    `Batch.......: ${batchSize}`,
  );
  console.log(
    `Delay.......: ${delayMs} ms`,
  );
  console.log(
    `Retries.....: ${retries}`,
  );
  console.log(
    `Resume......: ${resume}`,
  );
  console.log("");

  const summaries = [];

  for (const lotteryKey of lotteryKeys) {
    const summary =
      await importLottery({
        lotteryKey,
        shouldWrite,
        pilotCount,
        startArgument,
        endArgument,
        batchSize,
        delayMs,
        retries,
        resume,
      });

    summaries.push(summary);
  }

  console.log("");
  console.table(
    summaries.map((item) => ({
      modalidade: item.lotteryName,
      inicio: item.startContest,
      fim: item.endContest,
      processados: item.processed,
      validados: item.validated,
      criados: item.created,
      protegidos: item.protected,
      falhas: item.failed,
    })),
  );

  const totalFailures =
    summaries.reduce(
      (total, item) =>
        total + item.failed,
      0,
    );

  if (totalFailures > 0) {
    console.error("");
    console.error(
      `Importação concluída com ${totalFailures} falha(s).`,
    );

    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log(
    shouldWrite
      ? "Importação histórica concluída."
      : "Dry-run histórico concluído. Nenhuma escrita foi realizada.",
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    error instanceof Error
      ? error.stack
      : error,
  );

  process.exitCode = 1;
});
