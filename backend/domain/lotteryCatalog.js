"use strict";

export const LOTTERY_CATALOG = Object.freeze({
  lotofacil: Object.freeze({
    key: "lotofacil",
    name: "Lotofácil",
    caixaPath: "lotofacil",
    expectedType: "LOTOFACIL",
    drawSize: 15,
    minNumber: 1,
    maxNumber: 25,
  }),

  "mega-sena": Object.freeze({
    key: "mega-sena",
    name: "Mega-Sena",
    caixaPath: "megasena",
    expectedType: "MEGA_SENA",
    drawSize: 6,
    minNumber: 1,
    maxNumber: 60,
  }),

  quina: Object.freeze({
    key: "quina",
    name: "Quina",
    caixaPath: "quina",
    expectedType: "QUINA",
    drawSize: 5,
    minNumber: 1,
    maxNumber: 80,
  }),

  lotomania: Object.freeze({
    key: "lotomania",
    name: "Lotomania",
    caixaPath: "lotomania",
    expectedType: "LOTOMANIA",
    drawSize: 20,
    minNumber: 0,
    maxNumber: 99,
  }),
});

export const LOTTERY_KEYS = Object.freeze(
  Object.keys(LOTTERY_CATALOG),
);

export function getLotteryDefinition(key) {
  const normalized = String(key || "")
    .trim()
    .toLowerCase();

  const lottery = LOTTERY_CATALOG[normalized];

  if (!lottery) {
    throw new Error(
      `Modalidade inválida: ${key}. ` +
      `Utilize: ${LOTTERY_KEYS.join(", ")}.`,
    );
  }

  return lottery;
}
