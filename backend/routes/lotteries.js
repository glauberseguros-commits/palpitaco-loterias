"use strict";

import { Router } from "express";

import {
  getLatestOfficialResult,
  getOfficialResult,
  getOfficialResultHistory,
  getOfficialResultsByDate,
} from "../services/officialResultsService.js";

import {
  getLotteryDefinition,
  LOTTERY_KEYS,
} from "../domain/lotteryCatalog.js";

const router = Router();

function normalizeLotteryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeContest(value) {
  const contest = Number(value);

  if (
    !Number.isInteger(contest) ||
    contest <= 0
  ) {
    return null;
  }

  return contest;
}

function toPublicResult(result) {
  if (!result) {
    return null;
  }

  return {
    id: result.id,
    lotteryKey: result.lotteryKey,
    lotteryName: result.lotteryName,
    contest: result.contest,
    drawDate: result.drawDate,
    nextDrawDate: result.nextDrawDate,

    numbers: Array.isArray(result.numbers)
      ? result.numbers
      : [],

    drawOrderNumbers: Array.isArray(
      result.drawOrderNumbers,
    )
      ? result.drawOrderNumbers
      : [],

    accumulated:
      result.accumulated === true,

    estimatedNextPrize:
      Number(result.estimatedNextPrize || 0),

    accumulatedNextContest:
      Number(result.accumulatedNextContest || 0),

    accumulatedSpecialDraw:
      Number(result.accumulatedSpecialDraw || 0),

    totalCollected:
      Number(result.totalCollected || 0),

    prizeRanges: Array.isArray(
      result.prizeRanges,
    )
      ? result.prizeRanges
      : [],

    previousContest:
      result.previousContest || null,

    nextContest:
      result.nextContest || null,

    drawLocation:
      result.drawLocation || "",

    drawCityState:
      result.drawCityState || "",

    status:
      result.status || "official",

    immutable:
      result.immutable === true,

    officialSource: {
      provider:
        result.officialSource?.provider ||
        "CAIXA",

      system:
        result.officialSource?.system ||
        "Portal de Loterias CAIXA",

      contractVersion:
        result.officialSource?.contractVersion ||
        "CAIXA_PORTAL_LOTERIAS_V1",

      fetchedAt:
        result.officialSource?.fetchedAt ||
        null,
    },
  };
}

function sendError(
  response,
  status,
  code,
  message,
) {
  return response.status(status).json({
    ok: false,
    error: {
      code,
      message,
    },
  });
}

router.get("/latest", async (_request, response) => {
  try {
    const results = await Promise.all(
      LOTTERY_KEYS.map(async (lotteryKey) => {
        const result =
          await getLatestOfficialResult(
            lotteryKey,
          );

        return toPublicResult(result);
      }),
    );

    return response.json({
      ok: true,
      source: "CAIXA",
      count: results.filter(Boolean).length,
      results: results.filter(Boolean),
    });
  } catch (error) {
    console.error(
      "[PUBLIC_API_LATEST_ALL]",
      error,
    );

    return sendError(
      response,
      500,
      "LATEST_RESULTS_READ_FAILED",
      "Não foi possível consultar os resultados oficiais.",
    );
  }
});

router.get(
  "/latest/:lotteryKey",
  async (request, response) => {
    const lotteryKey = normalizeLotteryKey(
      request.params.lotteryKey,
    );

    try {
      getLotteryDefinition(lotteryKey);
    } catch {
      return sendError(
        response,
        400,
        "INVALID_LOTTERY",
        "Modalidade inválida.",
      );
    }

    try {
      const result =
        await getLatestOfficialResult(
          lotteryKey,
        );

      if (!result) {
        return sendError(
          response,
          404,
          "LATEST_RESULT_NOT_FOUND",
          "Resultado mais recente não encontrado.",
        );
      }

      return response.json({
        ok: true,
        source: "CAIXA",
        result: toPublicResult(result),
      });
    } catch (error) {
      console.error(
        "[PUBLIC_API_LATEST_ONE]",
        error,
      );

      return sendError(
        response,
        500,
        "LATEST_RESULT_READ_FAILED",
        "Não foi possível consultar o resultado oficial.",
      );
    }
  },
);

router.get(
  "/:lotteryKey/by-date",
  async (request, response) => {
    const lotteryKey = normalizeLotteryKey(
      request.params.lotteryKey,
    );

    try {
      getLotteryDefinition(lotteryKey);
    } catch {
      return sendError(
        response,
        400,
        "INVALID_LOTTERY",
        "Modalidade inválida.",
      );
    }

    const date = String(
      request.query.date || "",
    ).trim();

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return sendError(
        response,
        400,
        "INVALID_DRAW_DATE",
        "Informe a data no formato YYYY-MM-DD.",
      );
    }

    try {
      const results =
        await getOfficialResultsByDate(
          lotteryKey,
          date,
        );

      return response.json({
        ok: true,
        source: "CAIXA",
        lotteryKey,
        date,
        count: results.length,
        results: results.map(
          toPublicResult,
        ),
      });
    } catch (error) {
      console.error(
        "[PUBLIC_API_BY_DATE]",
        error,
      );

      return sendError(
        response,
        500,
        "DATE_RESULTS_READ_FAILED",
        "Não foi possível consultar os resultados pela data.",
      );
    }
  },
);
router.get(
  "/:lotteryKey/history",
  async (request, response) => {
    const lotteryKey = normalizeLotteryKey(
      request.params.lotteryKey,
    );

    try {
      getLotteryDefinition(lotteryKey);
    } catch {
      return sendError(
        response,
        400,
        "INVALID_LOTTERY",
        "Modalidade inválida.",
      );
    }

    const limitText =
      String(
        request.query.limit || "",
      ).trim();

    const cursorText =
      String(
        request.query.cursor || "",
      ).trim();

    const limit =
      limitText
        ? Number(limitText)
        : 20;

    const cursor =
      cursorText
        ? Number(cursorText)
        : null;

    if (
      !Number.isInteger(limit) ||
      limit <= 0 ||
      limit > 100
    ) {
      return sendError(
        response,
        400,
        "INVALID_HISTORY_LIMIT",
        "O limite deve ser um inteiro entre 1 e 100.",
      );
    }

    if (
      cursorText &&
      (
        !Number.isInteger(cursor) ||
        cursor <= 0
      )
    ) {
      return sendError(
        response,
        400,
        "INVALID_HISTORY_CURSOR",
        "Cursor histórico inválido.",
      );
    }

    try {
      const history =
        await getOfficialResultHistory(
          lotteryKey,
          {
            limit,
            cursor,
          },
        );

      return response.json({
        ok: true,
        source: "CAIXA",
        lotteryKey,
        count:
          history.results.length,

        results:
          history.results.map(
            toPublicResult,
          ),

        pagination: {
          latestContest:
            history.latestContest,

          limit:
            history.limit,

          cursor:
            history.cursor,

          nextCursor:
            history.nextCursor,

          hasMore:
            history.hasMore,
        },
      });
    } catch (error) {
      console.error(
        "[PUBLIC_API_HISTORY]",
        error,
      );

      return sendError(
        response,
        500,
        "HISTORY_RESULTS_READ_FAILED",
        "Não foi possível consultar o histórico oficial.",
      );
    }
  },
);
router.get(
  "/:lotteryKey/:contest",
  async (request, response) => {
    const lotteryKey = normalizeLotteryKey(
      request.params.lotteryKey,
    );

    try {
      getLotteryDefinition(lotteryKey);
    } catch {
      return sendError(
        response,
        400,
        "INVALID_LOTTERY",
        "Modalidade inválida.",
      );
    }

    const contest = normalizeContest(
      request.params.contest,
    );

    if (!contest) {
      return sendError(
        response,
        400,
        "INVALID_CONTEST",
        "Número do concurso inválido.",
      );
    }

    try {
      const result = await getOfficialResult(
        lotteryKey,
        contest,
      );

      if (!result) {
        return sendError(
          response,
          404,
          "OFFICIAL_RESULT_NOT_FOUND",
          "Concurso oficial não encontrado.",
        );
      }

      return response.json({
        ok: true,
        source: "CAIXA",
        result: toPublicResult(result),
      });
    } catch (error) {
      console.error(
        "[PUBLIC_API_CONTEST]",
        error,
      );

      return sendError(
        response,
        500,
        "OFFICIAL_RESULT_READ_FAILED",
        "Não foi possível consultar o concurso oficial.",
      );
    }
  },
);

export default router;


