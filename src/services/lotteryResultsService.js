/*
 * Fonte primária planejada:
 * Loterias CAIXA.
 *
 * A aplicação não consumirá resultados diretamente na interface.
 * O fluxo definitivo será:
 *
 * CAIXA -> importador próprio -> Firestore -> frontend.
 */

export async function getLatestLotteryResult() {
  return {
    status: "not_connected",
    source: "Loterias CAIXA",
    data: null,
  };
}
