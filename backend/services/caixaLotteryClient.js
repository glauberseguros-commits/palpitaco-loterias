"use strict";

const BASE_URL =
  "https://servicebus2.caixa.gov.br/portaldeloterias/api";

const DEFAULT_TIMEOUT_MS = 30000;

async function fetchWithTimeout(
  url,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Palpitaco-Loterias-Official-Importer/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `CAIXA HTTP ${response.status} para ${url}.`,
      );
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error(
        `Content-Type inesperado da CAIXA: ${contentType}.`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `Tempo limite excedido ao consultar ${url}.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLatestCaixaResult(
  lottery,
  options = {},
) {
  const timeoutMs = Number(
    options.timeoutMs || DEFAULT_TIMEOUT_MS,
  );

  const url =
    `${BASE_URL}/${lottery.caixaPath}`;

  return fetchWithTimeout(url, timeoutMs);
}

export async function fetchCaixaContest(
  lottery,
  contest,
  options = {},
) {
  const contestNumber = Number(contest);

  if (
    !Number.isInteger(contestNumber) ||
    contestNumber <= 0
  ) {
    throw new Error(
      `Número de concurso inválido: ${contest}.`,
    );
  }

  const timeoutMs = Number(
    options.timeoutMs || DEFAULT_TIMEOUT_MS,
  );

  const url =
    `${BASE_URL}/${lottery.caixaPath}/${contestNumber}`;

  return fetchWithTimeout(url, timeoutMs);
}
