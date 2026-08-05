import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LOTTERY_CATALOG,
} from "../../data/lotteries";

import {
  getLatestLotteryResults,
} from "../../services/lotteryResultsService";

function formatDate(value) {
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

function lotteryDefinition(lotteryKey) {
  return (
    LOTTERY_CATALOG.find(
      (lottery) =>
        lottery.key === lotteryKey,
    ) || {
      key: lotteryKey,
      name: lotteryKey,
    }
  );
}

export default function Resultados() {
  const [results, setResults] =
    useState([]);

  const [selectedLotteryKey, setSelectedLotteryKey] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadResults() {
    setLoading(true);
    setError("");

    try {
      const officialResults =
        await getLatestLotteryResults();

      setResults(officialResults);
    } catch (loadError) {
      setResults([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os resultados oficiais.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  const visibleResults = useMemo(() => {
    if (selectedLotteryKey === "all") {
      return results;
    }

    return results.filter(
      (result) =>
        result.lotteryKey ===
        selectedLotteryKey,
    );
  }, [
    results,
    selectedLotteryKey,
  ]);

  return (
    <section className="page results-page">
      <header className="page-header">
        <span className="eyebrow">
          Resultados oficiais
        </span>

        <h1>Resultados</h1>

        <p>
          Consulte os concursos mais recentes
          importados da Loterias CAIXA e protegidos
          contra alterações posteriores.
        </p>
      </header>

      <div
        className="results-filter"
        aria-label="Filtrar resultados por modalidade"
      >
        <button
          type="button"
          className={
            selectedLotteryKey === "all"
              ? "lottery-tab lottery-tab-active"
              : "lottery-tab"
          }
          onClick={() =>
            setSelectedLotteryKey("all")
          }
        >
          Todas
        </button>

        {LOTTERY_CATALOG.map((lottery) => (
          <button
            key={lottery.key}
            type="button"
            className={
              selectedLotteryKey === lottery.key
                ? "lottery-tab lottery-tab-active"
                : "lottery-tab"
            }
            onClick={() =>
              setSelectedLotteryKey(lottery.key)
            }
          >
            {lottery.name}
          </button>
        ))}
      </div>

      {loading && (
        <div
          className="results-loading"
          role="status"
          aria-live="polite"
        >
          <span className="result-loader" />

          <strong>
            Consultando resultados oficiais
          </strong>

          <p>
            Aguarde enquanto os concursos são
            carregados da API pública.
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          className="results-loading results-loading-error"
          role="alert"
        >
          <strong>
            Resultados temporariamente indisponíveis
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
        visibleResults.length > 0 && (
          <div className="official-results-grid">
            {visibleResults.map((result) => {
              const lottery =
                lotteryDefinition(
                  result.lotteryKey,
                );

              return (
                <article
                  key={result.id || result.lotteryKey}
                  className="official-result-card"
                >
                  <header className="official-result-card-header">
                    <div>
                      <span className="panel-label">
                        Loterias CAIXA
                      </span>

                      <h2>{lottery.name}</h2>
                    </div>

                    <span className="status-badge status-badge-success">
                      Oficial
                    </span>
                  </header>

                  <div className="official-result-card-summary">
                    <div>
                      <span>Concurso</span>

                      <strong>
                        {result.contest}
                      </strong>
                    </div>

                    <div>
                      <span>Data</span>

                      <strong>
                        {formatDate(
                          result.drawDate,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div
                    className="official-result-card-numbers"
                    aria-label={
                      `Dezenas do concurso ` +
                      result.contest
                    }
                  >
                    {result.numbers.map(
                      (number) => (
                        <span key={number}>
                          {number}
                        </span>
                      ),
                    )}
                  </div>

                  <div className="official-result-card-details">
                    <div>
                      <span>Situação</span>

                      <strong>
                        {result.accumulated
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
                          result.estimatedNextPrize,
                        )}
                      </strong>
                    </div>
                  </div>

                  <footer className="official-result-card-footer">
                    <span>
                      Fonte confirmada
                    </span>

                    <strong>
                      Concurso oficial e imutável
                    </strong>
                  </footer>
                </article>
              );
            })}
          </div>
        )}

      {!loading &&
        !error &&
        visibleResults.length === 0 && (
          <div className="results-loading">
            <strong>
              Nenhum resultado localizado
            </strong>

            <p>
              Não existe concurso disponível para
              o filtro selecionado.
            </p>
          </div>
        )}
    </section>
  );
}
