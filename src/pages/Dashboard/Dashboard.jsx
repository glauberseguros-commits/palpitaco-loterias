import {
  useEffect,
  useState,
} from "react";

import {
  LOTTERY_CATALOG,
} from "../../data/lotteries";

import {
  getLatestLotteryResults,
} from "../../services/lotteryResultsService";

function formatDrawDate(value) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return "Data não informada";
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Não informado";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function mapResultsByLottery(results) {
  return Object.fromEntries(
    results.map((result) => [
      result.lotteryKey,
      result,
    ]),
  );
}

export default function Dashboard() {
  const [selectedLotteryKey, setSelectedLotteryKey] =
    useState(LOTTERY_CATALOG[0].key);

  const [resultsByLottery, setResultsByLottery] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadResults() {
    setLoading(true);
    setError("");

    try {
      const results =
        await getLatestLotteryResults();

      setResultsByLottery(
        mapResultsByLottery(results),
      );
    } catch (loadError) {
      setResultsByLottery({});
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os resultados.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  const selectedLottery =
    LOTTERY_CATALOG.find(
      (lottery) =>
        lottery.key === selectedLotteryKey,
    ) || LOTTERY_CATALOG[0];

  const selectedResult =
    resultsByLottery[selectedLotteryKey] || null;

  return (
    <section className="page">
      <header className="page-header">
        <span className="eyebrow">
          Visão geral
        </span>

        <h1>Palpitaco Loterias</h1>

        <p>
          Resultados oficiais, análises, estatísticas,
          geradores e conferência em um único ambiente.
        </p>
      </header>

      <div
        className="lottery-selector"
        aria-label="Selecionar modalidade"
      >
        {LOTTERY_CATALOG.map((lottery) => (
          <button
            key={lottery.key}
            type="button"
            className={
              lottery.key === selectedLotteryKey
                ? "lottery-tab lottery-tab-active"
                : "lottery-tab"
            }
            aria-pressed={
              lottery.key === selectedLotteryKey
            }
            onClick={() =>
              setSelectedLotteryKey(lottery.key)
            }
          >
            {lottery.name}
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <article className="panel result-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">
                Fonte oficial
              </span>

              <h2>Último resultado</h2>
            </div>

            <span
              className={
                error
                  ? "status-badge status-badge-error"
                  : "status-badge status-badge-success"
              }
            >
              {loading
                ? "Consultando"
                : error
                  ? "Indisponível"
                  : "CAIXA confirmado"}
            </span>
          </div>

          {loading && (
            <div
              className="result-state"
              role="status"
              aria-live="polite"
            >
              <span className="result-loader" />

              <strong>
                Consultando resultado oficial
              </strong>

              <p>
                Aguarde enquanto carregamos os dados
                persistidos da Loterias CAIXA.
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              className="result-state result-state-error"
              role="alert"
            >
              <strong>
                Resultado temporariamente indisponível
              </strong>

              <p>{error}</p>

              <button
                type="button"
                className="secondary-button"
                onClick={loadResults}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            selectedResult && (
              <div className="official-result">
                <div className="result-summary">
                  <div>
                    <span>Modalidade</span>

                    <strong>
                      {selectedLottery.name}
                    </strong>
                  </div>

                  <div>
                    <span>Concurso</span>

                    <strong>
                      {selectedResult.contest}
                    </strong>
                  </div>

                  <div>
                    <span>Data</span>

                    <strong>
                      {formatDrawDate(
                        selectedResult.drawDate,
                      )}
                    </strong>
                  </div>
                </div>

                <div
                  className="result-numbers"
                  aria-label={
                    `Dezenas do concurso ` +
                    selectedResult.contest
                  }
                >
                  {selectedResult.numbers.map(
                    (number) => (
                      <span key={number}>
                        {number}
                      </span>
                    ),
                  )}
                </div>

                <div className="result-details">
                  <div>
                    <span>Situação</span>

                    <strong>
                      {selectedResult.accumulated
                        ? "Acumulou"
                        : "Teve ganhador"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Estimativa do próximo prêmio
                    </span>

                    <strong>
                      {formatMoney(
                        selectedResult
                          .estimatedNextPrize,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="official-confirmation">
                  <span>Fonte</span>

                  <strong>
                    Loterias CAIXA
                  </strong>

                  <small>
                    Concurso oficial persistido e
                    protegido contra alteração.
                  </small>
                </div>
              </div>
            )}

          {!loading &&
            !error &&
            !selectedResult && (
              <div className="result-state">
                <strong>
                  Resultado não localizado
                </strong>

                <p>
                  Ainda não existe resultado persistido
                  para {selectedLottery.name}.
                </p>
              </div>
            )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">
                Ferramenta
              </span>

              <h2>Gerador inteligente</h2>
            </div>
          </div>

          <div className="empty-module">
            <strong>
              Motor ainda não implementado
            </strong>

            <p>
              O gerador será construído com regras
              específicas para cada modalidade e
              métricas claramente identificadas.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
