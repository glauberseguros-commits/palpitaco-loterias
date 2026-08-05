export const LOTTERY_CATALOG = [
  {
    key: "lotofacil",
    name: "Lotofácil",
    minNumber: 1,
    maxNumber: 25,
    drawSize: 15,
  },
  {
    key: "mega-sena",
    name: "Mega-Sena",
    minNumber: 1,
    maxNumber: 60,
    drawSize: 6,
  },
  {
    key: "quina",
    name: "Quina",
    minNumber: 1,
    maxNumber: 80,
    drawSize: 5,
  },
  {
    key: "lotomania",
    name: "Lotomania",
    minNumber: 0,
    maxNumber: 99,
    drawSize: 20,
  },
];

export function findLottery(key) {
  return LOTTERY_CATALOG.find((lottery) => lottery.key === key) || LOTTERY_CATALOG[0];
}
