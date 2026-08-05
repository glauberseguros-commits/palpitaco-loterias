"use strict";

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

function resolveRequestedLotteries(value) {
  const requested =
    String(value || "all")
      .trim()
      .toLowerCase();

  if (requested === "all") {
    return [...LOTTERY_KEYS];
  }

  return requested
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function printSummary(rows) {
  console.table(
    rows.map((row) => ({
      modalidade: row.lotteryName,
      concurso: row.contest,
      data: row.drawDate,
      dezenas: row.numbers.join(" "),
      modo: row.mode,
      persistencia: row.persistence,
    })),
  );
}

async function importOne({
  lotteryKey,
  contest,
  shouldWrite,
}) {
  const lottery =
    getLotteryDefinition(lotteryKey);

  const fetchedAt = new Date();

  const raw = contest
    ? await fetchCaixaContest(
        lottery,
        contest,
      )
    : await fetchLatestCaixaResult(
        lottery,
      );

  const normalized =
    normalizeCaixaResult({
      raw,
      lottery,
      fetchedAt,
    });

  if (!shouldWrite) {
    return {
      ...normalized,
      mode: "dry-run",
      persistence: "não executada",
    };
  }

  const persistence =
    await saveOfficialLotteryResult(
      normalized,
    );

  return {
    ...normalized,
    mode: "write",
    persistence:
      persistence.created
        ? "criado"
        : "já existente/protegido",
    persistenceResult: persistence,
  };
}

async function main() {
  const lotteryArgument =
    readArgument("lottery") || "all";

  const contestArgument =
    readArgument("contest");

  const shouldWrite =
    hasFlag("write");

  const requestedLotteries =
    resolveRequestedLotteries(
      lotteryArgument,
    );

  if (
    contestArgument &&
    requestedLotteries.length !== 1
  ) {
    throw new Error(
      "--contest exige exatamente uma modalidade.",
    );
  }

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "PALPITACO LOTERIAS — CAIXA OFFICIAL IMPORTER V1",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    `Modo: ${shouldWrite ? "WRITE" : "DRY-RUN"}`,
  );
  console.log(
    `Modalidades: ${requestedLotteries.join(", ")}`,
  );

  if (contestArgument) {
    console.log(
      `Concurso solicitado: ${contestArgument}`,
    );
  }

  const results = [];
  const failures = [];

  for (const lotteryKey of requestedLotteries) {
    try {
      const result = await importOne({
        lotteryKey,
        contest:
          contestArgument || null,
        shouldWrite,
      });

      results.push(result);

      console.log(
        `[OK] ${result.lotteryName} ` +
        `concurso=${result.contest}`,
      );
    } catch (error) {
      failures.push({
        lotteryKey,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

      console.error(
        `[ERRO] ${lotteryKey}: ` +
        failures[failures.length - 1].error,
      );
    }
  }

  console.log("");

  if (results.length) {
    printSummary(results);
  }

  if (failures.length) {
    console.error("");
    console.error("Falhas:");

    console.table(failures);

    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log(
    shouldWrite
      ? "Importação oficial concluída."
      : "Dry-run concluído. Nenhuma escrita foi realizada.",
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
