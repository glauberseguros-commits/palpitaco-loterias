import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  LOTTERY_CATALOG,
} from "../../data/lotteries";

import {
  getLotteryHistory,
  getLotteryResultByContest,
} from "../../services/lotteryResultsService";

const PAGE_LIMIT = 20;

function formatDate(value) {
  const match = String(
    value || "",
  ).match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return "Data não informada";
  }

  const [, year, month, day] =
    match;

  return `${day}/${month}/${year}`;
}

function formatMoney(value) {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
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

function getLotteryDefinition(
  lotteryKey,
) {
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

function ResultCard({
  result,
}) {
  const lottery =
    getLotteryDefinition(
      result.lotteryKey,
    );

  return (
    <article className="official-result-card">
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
          (number, index) => (
            <span
              key={
                `${result.contest}-` +
                `${number}-${index}`
              }
            >
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
}

export default function Resultados() {
  const [selectedLotteryKey, setSelectedLotteryKey] =
    useState(
      LOTTERY_CATALOG[0]?.key ||
      "mega-sena",
    );

  const [results, setResults] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      nextCursor: null,
      hasMore: false,
      latestContest: null,
    });

  const [loading, setLoading] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [error, setError] =
    useState("");

  const [contestInput, setContestInput] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const [searchMode, setSearchMode] =
    useState(false);

  const loadFirstPage = useCallback(
    async () => {
      setLoading(true);
      setError("");
      setSearchMode(false);
      setContestInput("");

      try {
        const history =
          await getLotteryHistory(
            selectedLotteryKey,
            {
              limit: PAGE_LIMIT,
            },
          );

        setResults(
          history.results,
        );

        setPagination(
          history.pagination,
        );
      } catch (loadError) {
        setResults([]);

        setPagination({
          nextCursor: null,
          hasMore: false,
          latestContest: null,
        });

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar o histórico oficial.",
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedLotteryKey],
  );

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (
      loadingMore ||
      !pagination.hasMore ||
      !pagination.nextCursor
    ) {
      return;
    }

    setLoadingMore(true);
    setError("");

    try {
      const history =
        await getLotteryHistory(
          selectedLotteryKey,
          {
            limit: PAGE_LIMIT,
            cursor:
              pagination.nextCursor,
          },
        );

      setResults(
        (currentResults) => [
          ...currentResults,
          ...history.results.filter(
            (candidate) =>
              !currentResults.some(
                (current) =>
                  current.id ===
                  candidate.id,
              ),
          ),
        ],
      );

      setPagination(
        history.pagination,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar mais concursos.",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function searchContest(
    event,
  ) {
    event.preventDefault();

    const contest =
      Number(contestInput);

    if (
      !Number.isInteger(contest) ||
      contest <= 0
    ) {
      setError(
        "Informe um número de concurso válido.",
      );

      return;
    }

    setSearching(true);
    setError("");

    try {
      const result =
        await getLotteryResultByContest(
          selectedLotteryKey,
          contest,
        );

      setResults([result]);

      setPagination({
        nextCursor: null,
        hasMore: false,
        latestContest:
          pagination.latestContest,
      });

      setSearchMode(true);
    } catch (searchError) {
      setResults([]);

      setSearchMode(true);

      setError(
        searchError instanceof Error
          ? searchError.message
          : "Concurso não localizado.",
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="page results-page">
      <header className="page-header">
        <span className="eyebrow">
          Resultados oficiais
        </span>

        <h1>Histórico de resultados</h1>

        <p>
          Consulte todos os concursos oficiais
          importados da Loterias CAIXA.
        </p>
      </header>

      <div
        className="results-filter"
        aria-label="Selecionar modalidade"
      >
        {LOTTERY_CATALOG.map(
          (lottery) => (
            <button
              key={lottery.key}
              type="button"
              className={
                selectedLotteryKey ===
                lottery.key
                  ? "lottery-tab lottery-tab-active"
                  : "lottery-tab"
              }
              onClick={() =>
                setSelectedLotteryKey(
                  lottery.key,
                )
              }
            >
              {lottery.name}
            </button>
          ),
        )}
      </div>

      <section className="history-toolbar">
        <div className="history-toolbar-summary">
          <span>
            Modalidade selecionada
          </span>

          <strong>
            {
              getLotteryDefinition(
                selectedLotteryKey,
              ).name
            }
          </strong>

          {pagination.latestContest && (
            <small>
              Último concurso:{" "}
              {pagination.latestContest}
            </small>
          )}
        </div>

        <form
          className="history-search"
          onSubmit={searchContest}
        >
          <label htmlFor="contest-search">
            Buscar concurso
          </label>

          <div>
            <input
              id="contest-search"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Ex.: 3040"
              value={contestInput}
              onChange={(event) =>
                setContestInput(
                  event.target.value,
                )
              }
            />

            <button
              type="submit"
              className="primary-button"
              disabled={searching}
            >
              {searching
                ? "Buscando..."
                : "Buscar"}
            </button>
          </div>
        </form>
      </section>

      {searchMode && (
        <button
          type="button"
          className="secondary-button history-back-button"
          onClick={loadFirstPage}
        >
          Voltar ao histórico
        </button>
      )}

      {loading && (
        <div
          className="results-loading"
          role="status"
          aria-live="polite"
        >
          <span className="result-loader" />

          <strong>
            Carregando histórico oficial
          </strong>

          <p>
            Aguarde enquanto os concursos são
            consultados.
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          className="results-loading results-loading-error"
          role="alert"
        >
          <strong>
            Não foi possível concluir a consulta
          </strong>

          <p>{error}</p>

          {!searchMode && (
            <button
              type="button"
              className="secondary-button"
              onClick={loadFirstPage}
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {!loading &&
        results.length > 0 && (
          <>
            <div className="official-results-grid">
              {results.map(
                (result) => (
                  <ResultCard
                    key={
                      result.id ||
                      `${result.lotteryKey}-${result.contest}`
                    }
                    result={result}
                  />
                ),
              )}
            </div>

            {!searchMode &&
              pagination.hasMore && (
                <div className="history-load-more">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? "Carregando..."
                      : "Carregar mais resultados"}
                  </button>

                  <small>
                    {results.length} concursos
                    exibidos
                  </small>
                </div>
              )}

            {!searchMode &&
              !pagination.hasMore && (
                <div className="history-end">
                  Todo o histórico disponível foi
                  carregado.
                </div>
              )}
          </>
        )}

      {!loading &&
        !error &&
        results.length === 0 && (
          <div className="results-loading">
            <strong>
              Nenhum concurso localizado
            </strong>

            <p>
              Verifique a modalidade ou o número
              informado.
            </p>
          </div>
        )}
    </section>
  );
}
