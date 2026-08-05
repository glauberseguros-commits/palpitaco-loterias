"use strict";

import { getAdminFirestore }
from "../repositories/lotteryResultRepository.js";

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

  const latestData = latest.data();

  const official = await db
    .collection("lottery_results")
    .doc(latestData.resultId)
    .get();

  if (!official.exists) {
    throw new Error(
      `Documento ${latestData.resultId} inexistente.`
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

  if (!contest) {
    throw new Error("contest obrigatório.");
  }

  const db = getAdminFirestore();

  const id =
    `${lotteryKey}__${contest}`;

  const doc = await db
    .collection("lottery_results")
    .doc(id)
    .get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
}
