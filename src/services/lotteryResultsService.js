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

export async function getLotteryHistory(
  lotteryKey,
  options = {},
) {
  const key = String(
    lotteryKey || "",
  ).trim();

  if (!key) {
    throw new Error(
      "Modalidade não informada.",
    );
  }

  const requestedLimit = Number(
    options.limit ?? 20,
  );

  if (
    !Number.isInteger(requestedLimit) ||
    requestedLimit <= 0 ||
    requestedLimit > 100
  ) {
    throw new Error(
      "O limite deve ser um inteiro entre 1 e 100.",
    );
  }

  const cursor =
    options.cursor === null ||
    options.cursor === undefined ||
    options.cursor === ""
      ? null
      : Number(options.cursor);

  if (
    cursor !== null &&
    (
      !Number.isInteger(cursor) ||
      cursor <= 0
    )
  ) {
    throw new Error(
      "Cursor histórico inválido.",
    );
  }

  const parameters =
    new URLSearchParams();

  parameters.set(
    "limit",
    String(requestedLimit),
  );

  if (cursor !== null) {
    parameters.set(
      "cursor",
      String(cursor),
    );
  }

  const payload = await requestJson(
    `/api/lotteries/${encodeURIComponent(key)}/history?${parameters.toString()}`,
  );

  if (!Array.isArray(payload.results)) {
    throw new Error(
      "A API não retornou o histórico oficial.",
    );
  }

  const pagination =
    payload.pagination &&
    typeof payload.pagination === "object"
      ? payload.pagination
      : {};

  return {
    results: payload.results.map(
      validateOfficialResult,
    ),

    pagination: {
      latestContest:
        Number(
          pagination.latestContest,
        ) || null,

      limit:
        Number(
          pagination.limit,
        ) || requestedLimit,

      cursor:
        Number(
          pagination.cursor,
        ) || null,

      nextCursor:
        Number(
          pagination.nextCursor,
        ) || null,

      hasMore:
        pagination.hasMore === true,
    },
  };
}

export async function getLotteryResultByContest(
  lotteryKey,
  contest,
) {
  const key = String(
    lotteryKey || "",
  ).trim();

  const contestNumber =
    Number(contest);

  if (!key) {
    throw new Error(
      "Modalidade não informada.",
    );
  }

  if (
    !Number.isInteger(contestNumber) ||
    contestNumber <= 0
  ) {
    throw new Error(
      "Informe um número de concurso válido.",
    );
  }

  const payload = await requestJson(
    `/api/lotteries/${encodeURIComponent(key)}/${contestNumber}`,
  );

  return validateOfficialResult(
    payload.result,
  );
}
export function getLotteryApiBaseUrl() {
  return API_BASE_URL;
}

