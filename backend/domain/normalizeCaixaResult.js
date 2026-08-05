"use strict";

function requiredObject(value, label) {
  if (!value || typeof value !== "object") {
    throw new Error(`${label} ausente ou inválido.`);
  }

  return value;
}

function requiredPositiveInteger(value, label) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} inválido: ${value}.`);
  }

  return number;
}

function normalizeBoolean(value) {
  return value === true;
}

function normalizeMoney(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function parseBrazilianDate(value, label, nullable = false) {
  const text = String(value || "").trim();

  if (!text && nullable) {
    return null;
  }

  const match = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (!match) {
    throw new Error(
      `${label} inválida: ${text || "[vazia]"}.`,
    );
  }

  const [, day, month, year] = match;
  const ymd = `${year}-${month}-${day}`;
  const date = new Date(`${ymd}T12:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== ymd
  ) {
    throw new Error(`${label} inexistente: ${text}.`);
  }

  return ymd;
}

function normalizeNumbers(rawNumbers, lottery) {
  if (!Array.isArray(rawNumbers)) {
    throw new Error("listaDezenas ausente ou inválida.");
  }

  if (rawNumbers.length !== lottery.drawSize) {
    throw new Error(
      `${lottery.name}: quantidade de dezenas inválida. ` +
      `Esperado=${lottery.drawSize}, recebido=${rawNumbers.length}.`,
    );
  }

  const normalized = rawNumbers.map((value) => {
    const text = String(value ?? "").trim();

    if (!/^\d{1,2}$/.test(text)) {
      throw new Error(`Dezena inválida: ${value}.`);
    }

    const number = Number(text);

    if (
      number < lottery.minNumber ||
      number > lottery.maxNumber
    ) {
      throw new Error(
        `Dezena fora do intervalo da ${lottery.name}: ${number}.`,
      );
    }

    return String(number).padStart(2, "0");
  });

  const unique = new Set(normalized);

  if (unique.size !== normalized.length) {
    throw new Error(
      `${lottery.name}: existem dezenas repetidas no resultado.`,
    );
  }

  return normalized;
}

function normalizePrizeRanges(value) {
  if (!Array.isArray(value) || !value.length) {
    throw new Error(
      "listaRateioPremio ausente ou vazia.",
    );
  }

  return value.map((item, index) => {
    requiredObject(
      item,
      `listaRateioPremio[${index}]`,
    );

    return {
      faixa: Number(item.faixa || index + 1),
      descricao:
        String(item.descricaoFaixa || "").trim(),
      ganhadores: Math.max(
        0,
        Number(item.numeroDeGanhadores || 0),
      ),
      valorPremio: normalizeMoney(item.valorPremio),
    };
  });
}

export function normalizeCaixaResult({
  raw,
  lottery,
  fetchedAt = new Date(),
}) {
  requiredObject(raw, "Resposta da CAIXA");
  requiredObject(lottery, "Definição da modalidade");

  const contest = requiredPositiveInteger(
    raw.numero,
    "Número do concurso",
  );

  const receivedType =
    String(raw.tipoJogo || "").trim();

  if (receivedType !== lottery.expectedType) {
    throw new Error(
      `${lottery.name}: tipoJogo inesperado. ` +
      `Esperado=${lottery.expectedType}, recebido=${receivedType}.`,
    );
  }

  const numbers = normalizeNumbers(
    raw.listaDezenas,
    lottery,
  );

  const drawDate = parseBrazilianDate(
    raw.dataApuracao,
    "Data da apuração",
  );

  const nextDrawDate = parseBrazilianDate(
    raw.dataProximoConcurso,
    "Data do próximo concurso",
    true,
  );

  const fetchedDate =
    fetchedAt instanceof Date
      ? fetchedAt
      : new Date(fetchedAt);

  if (Number.isNaN(fetchedDate.getTime())) {
    throw new Error("Data de consulta inválida.");
  }

  const documentId =
    `${lottery.key}__${contest}`;

  return {
    id: documentId,
    lotteryKey: lottery.key,
    lotteryName: lottery.name,
    contest,
    drawDate,
    nextDrawDate,

    numbers,
    numbersSorted: [...numbers].sort(
      (a, b) => Number(a) - Number(b),
    ),

    drawOrderNumbers: Array.isArray(
      raw.dezenasSorteadasOrdemSorteio,
    )
      ? raw.dezenasSorteadasOrdemSorteio.map(
          (number) =>
            String(Number(number)).padStart(2, "0"),
        )
      : [],

    accumulated: normalizeBoolean(raw.acumulado),

    estimatedNextPrize: normalizeMoney(
      raw.valorEstimadoProximoConcurso,
    ),

    accumulatedNextContest: normalizeMoney(
      raw.valorAcumuladoProximoConcurso,
    ),

    accumulatedSpecialDraw: normalizeMoney(
      raw.valorAcumuladoConcursoEspecial,
    ),

    totalCollected: normalizeMoney(
      raw.valorArrecadado,
    ),

    prizeRanges: normalizePrizeRanges(
      raw.listaRateioPremio,
    ),

    previousContest:
      Number(raw.numeroConcursoAnterior || 0) || null,

    nextContest:
      Number(raw.numeroConcursoProximo || 0) || null,

    drawLocation:
      String(raw.localSorteio || "").trim(),

    drawCityState:
      String(
        raw.nomeMunicipioUFSorteio || "",
      ).trim(),

    officialSource: {
      provider: "CAIXA",
      system: "Portal de Loterias CAIXA",
      endpoint:
        `https://servicebus2.caixa.gov.br/` +
        `portaldeloterias/api/${lottery.caixaPath}/${contest}`,
      fetchedAt:
        fetchedDate.toISOString(),
      contractVersion:
        "CAIXA_PORTAL_LOTERIAS_V1",
    },

    status: "official",
    immutable: true,

    raw: structuredClone(raw),
  };
}
