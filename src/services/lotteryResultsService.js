const DEFAULT_API_BASE_URL =
  "https://palpitaco-loterias-api-iuldf5oakq-rj.a.run.app";

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
    DEFAULT_API_BASE_URL,
)
  .trim()
  .replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 20000;

function validateApiBaseUrl() {
  if (!API_BASE_URL.startsWith("https://")) {
    throw new Error(
      "A URL pública da API é inválida.",
    );
  }
}

async function requestJson(path) {
  validateApiBaseUrl();

  const controller = new AbortController();

  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    );

    let payload;

    try {
      payload = await response.json();
    } catch {
      throw new Error(
        "A API retornou uma resposta inválida.",
      );
    }

    if (!response.ok || payload?.ok !== true) {
      throw new Error(
        payload?.error ||
          payload?.message ||
          `Falha HTTP ${response.status}.`,
      );
    }

    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "A consulta aos resultados excedeu o tempo limite.",
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar à API de resultados.",
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function validateOfficialResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error(
      "Resultado oficial ausente ou inválido.",
    );
  }

  if (!result.lotteryKey) {
    throw new Error(
      "Resultado sem identificação da modalidade.",
    );
  }

  if (
    !Number.isInteger(Number(result.contest)) ||
    Number(result.contest) <= 0
  ) {
    throw new Error(
      `Concurso inválido para ${result.lotteryKey}.`,
    );
  }

  if (
    !Array.isArray(result.numbers) ||
    !result.numbers.length
  ) {
    throw new Error(
      `Dezenas ausentes para ${result.lotteryKey}.`,
    );
  }

  if (
    result.officialSource?.provider !== "CAIXA"
  ) {
    throw new Error(
      `Fonte oficial inválida para ${result.lotteryKey}.`,
    );
  }

  return result;
}

export async function getLatestLotteryResults() {
  const payload = await requestJson(
    "/api/lotteries/latest",
  );

  if (!Array.isArray(payload.results)) {
    throw new Error(
      "A API não retornou a lista de resultados.",
    );
  }

  return payload.results.map(
    validateOfficialResult,
  );
}

export async function getLatestLotteryResult(
  lotteryKey,
) {
  const key = String(lotteryKey || "").trim();

  if (!key) {
    throw new Error(
      "Modalidade não informada.",
    );
  }

  const payload = await requestJson(
    `/api/lotteries/latest/${encodeURIComponent(key)}`,
  );

  return validateOfficialResult(
    payload.result,
  );
}

export function getLotteryApiBaseUrl() {
  return API_BASE_URL;
}
