"use strict";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

function resolveCredential() {
  const encoded =
    String(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
      "",
    ).trim();

  if (!encoded) {
    return applicationDefault();
  }

  let decoded;

  try {
    decoded = Buffer.from(
      encoded,
      "base64",
    ).toString("utf8");
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 inválido.",
    );
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(decoded);
  } catch {
    throw new Error(
      "A credencial Firebase não contém JSON válido.",
    );
  }

  return cert(serviceAccount);
}

export function getAdminFirestore() {
  if (!getApps().length) {
    initializeApp({
      credential: resolveCredential(),
      projectId:
        process.env.FIREBASE_PROJECT_ID ||
        "palpitaco-loterias-app",
    });
  }

  return getFirestore();
}

export async function saveOfficialLotteryResult(
  result,
  dependencies = {},
) {
  const database =
    dependencies.database ||
    getAdminFirestore();

  const resultRef = database
    .collection("lottery_results")
    .doc(result.id);

  const latestRef = database
    .collection("lottery_latest")
    .doc(result.lotteryKey);

  return database.runTransaction(
    async (transaction) => {
      const currentResult =
  await transaction.get(resultRef);

const currentLatest =
  await transaction.get(latestRef);

      const latestContest =
        currentLatest.exists
          ? Number(
              currentLatest.data()?.contest || 0,
            )
          : 0;

      const storedPayload = {
        ...result,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.create(
        resultRef,
        storedPayload,
      );

      if (Number(result.contest) >= latestContest) {
        transaction.set(
          latestRef,
          {
            lotteryKey: result.lotteryKey,
            lotteryName: result.lotteryName,
            contest: result.contest,
            resultId: result.id,
            drawDate: result.drawDate,
            numbers: result.numbers,
            accumulated: result.accumulated,
            estimatedNextPrize:
              result.estimatedNextPrize,
            officialSource:
              result.officialSource,
            updatedAt:
              FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      return {
        ok: true,
        created: true,
        existing: false,
        protected: false,
        id: result.id,
      };
    },
  );
}


