"use strict";

import {
  getAdminFirestore,
} from "../repositories/lotteryResultRepository.js";

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 100;

function positiveInteger(
  value,
  fallback = null,
) {
  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return fallback;
  }

  return number;
}

export async function getLatestOfficialResult(
  lotteryKey,
) {
  if (!lotteryKey) {
    throw new Error("lotteryKey obrigatório.");
  }

  const db = getAdminFirestore();

  const latest = await db
    .collection("lottery_latest")
    .doc(lotteryKey)
    .get();

  if (!latest.exists) {
    return null;
  }

  const latestData = latest.data() || {};

  const official = await db
    .collection("lottery_results")
    .doc(latestData.resultId)
    .get();

  if (!official.exists) {
    throw new Error(
      `Documento ${latestData.resultId} inexistente.`,
    );
  }

  return official.data();
}

export async function getOfficialResult(
  lotteryKey,
  contest,
) {
  if (!lotteryKey) {
    throw new Error("lotteryKey obrigatório.");
  }

  const contestNumber =
    positiveInteger(contest);

  if (!contestNumber) {
    throw new Error("contest obrigatório.");
  }

  const db = getAdminFirestore();

  const document = await db
    .collection("lottery_results")
    .doc(
      `${lotteryKey}__${contestNumber}`,
    )
    .get();

  if (!document.exists) {
    return null;
  }

  return document.data();
}

export async function getOfficialResultHistory(
  lotteryKey,
  options = {},
) {
  if (!lotteryKey) {
    throw new Error("lotteryKey obrigatório.");
  }

  const db =
    options.database ||
    getAdminFirestore();

  const requestedLimit =
    positiveInteger(
      options.limit,
      DEFAULT_HISTORY_LIMIT,
    );

  const limit = Math.min(
    requestedLimit,
    MAX_HISTORY_LIMIT,
  );

  const cursorProvided =
    options.cursor !== undefined &&
    options.cursor !== null &&
    options.cursor !== "";

  const requestedCursor =
    cursorProvided
      ? positiveInteger(options.cursor)
      : null;

  if (
    cursorProvided &&
    !requestedCursor
  ) {
    throw new Error(
      "Cursor histórico inválido.",
    );
  }

  const latestSnapshot = await db
    .collection("lottery_latest")
    .doc(lotteryKey)
    .get();

  if (!latestSnapshot.exists) {
    return {
      results: [],
      latestContest: null,
      limit,
      cursor: requestedCursor,
      nextCursor: null,
      hasMore: false,
    };
  }

  const latestContest =
    positiveInteger(
      latestSnapshot.data()?.contest,
    );

  if (!latestContest) {
    throw new Error(
      `Latest inválido para ${lotteryKey}.`,
    );
  }

  const startContest =
    requestedCursor
      ? Math.min(
          requestedCursor,
          latestContest,
        )
      : latestContest;

  const endContest = Math.max(
    1,
    startContest - limit + 1,
  );

  const references = [];

  for (
    let contest = startContest;
    contest >= endContest;
    contest -= 1
  ) {
    references.push(
      db
        .collection("lottery_results")
        .doc(
          `${lotteryKey}__${contest}`,
        ),
    );
  }

  const snapshots =
    references.length > 0
      ? await db.getAll(...references)
      : [];

  const results = snapshots
    .filter(
      (snapshot) => snapshot.exists,
    )
    .map(
      (snapshot) => snapshot.data(),
    )
    .sort(
      (first, second) =>
        Number(second.contest) -
        Number(first.contest),
    );

  const nextCursor =
    endContest > 1
      ? endContest - 1
      : null;

  return {
    results,
    latestContest,
    limit,
    cursor: requestedCursor,
    nextCursor,
    hasMore: nextCursor !== null,
  };
}

export async function getOfficialResultsByDate(
  lotteryKey,
  drawDate,
) {
  if (!lotteryKey) {
    throw new Error("lotteryKey obrigatório.");
  }

  const normalizedDate = String(
    drawDate || "",
  ).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalizedDate,
    )
  ) {
    throw new Error(
      "Data inválida. Utilize YYYY-MM-DD.",
    );
  }

  const database = getAdminFirestore();

  const snapshot = await database
    .collection("lottery_results")
    .where(
      "drawDate",
      "==",
      normalizedDate,
    )
    .get();

  return snapshot.docs
    .map((document) => document.data())
    .filter(
      (result) =>
        result?.lotteryKey === lotteryKey,
    )
    .sort(
      (first, second) =>
        Number(second.contest) -
        Number(first.contest),
    );
}

