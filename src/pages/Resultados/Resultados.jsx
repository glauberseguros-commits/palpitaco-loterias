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
  getLotteryResultByContest,
  getLotteryResultsByDate,
} from "../../services/lotteryResultsService";

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
    <article className="clean-result-card">
      <header className="clean-result-card-header">
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

      <div className="clean-result-summary">
        <div>
          <span>Concurso</span>
          <strong>{result.contest}</strong>
        </div>

        <div>
          <span>Data</span>
          <strong>
            {formatDate(result.drawDate)}
          </strong>
        </div>
      </div>

      <div className="clean-result-numbers">
        {result.numbers.map(
          (number, index) => (
            <span
              key={
                `${result.lotteryKey}-` +
                `${result.contest}-` +
                `${number}-${index}`
              }
            >
              {number}
            </span>
          ),
        )}
      </div>

      <div className="clean-result-details">
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

      <footer className="clean-result-footer">
        <span>Fonte confirmada</span>

        <strong>
          Concurso oficial e imutável
        </strong>
      </footer>
    </article>
  );
}

export default function Resultados() {
  const [latestResults, setLatestResults] =
    useState([]);

  const [selectedLotteryKey, setSelectedLotteryKey] =
    useState(
      LOTTERY_CATALOG[0]?.key ||
      "lotofacil",
    );

  const [searchType, setSearchType] =
    useState("contest");

  const [contestInput, setContestInput] =
    useState("");

  const [dateInput, setDateInput] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [searchMode, setSearchMode] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadLatest() {
      setLoading(true);
      setError("");

      try {
        const results =
          await getLatestLotteryResults();

        if (active) {
          setLatestResults(results);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar os últimos resultados.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLatest();

    return () => {
      active = false;
    };
  }, []);

  const selectedLottery =
    useMemo(
      () =>
        getLotteryDefinition(
          selectedLotteryKey,
        ),
      [selectedLotteryKey],
    );

  async function handleSearch(event) {
    event.preventDefault();

    setError("");
    setSearching(true);

    try {
      if (searchType === "contest") {
        const contest =
          Number(contestInput);

        if (
          !Number.isInteger(contest) ||
          contest <= 0
        ) {
          throw new Error(
            "Informe um número de concurso válido.",
          );
        }

        const result =
          await getLotteryResultByContest(
            selectedLotteryKey,
            contest,
          );

        setSearchResults([result]);
      } else {
        if (!dateInput) {
          throw new Error(
            "Selecione uma data no calendário.",
          );
        }

        const results =
          await getLotteryResultsByDate(
            selectedLotteryKey,
            dateInput,
          );

        setSearchResults(results);
      }

      setSearchMode(true);
    } catch (searchError) {
      setSearchResults([]);
      setSearchMode(true);

      setError(
        searchError instanceof Error
          ? searchError.message
          : "Não foi possível concluir a busca.",
      );
    } finally {
      setSearching(false);
    }
  }

  function returnToLatest() {
    setSearchMode(false);
    setSearchResults([]);
    setError("");
    setContestInput("");
    setDateInput("");
  }

  return (
    <section className="page clean-results-page">
      <header className="page-header">
        <span className="eyebrow">
          Resultados oficiais
        </span>

        <h1>Resultados</h1>

        <p>
          Veja os últimos concursos ou localize
          um resultado específico por número
          ou data.
        </p>
      </header>

      <section className="clean-search-panel">
        <div className="clean-search-heading">
          <span>Consulta oficial</span>

          <strong>
            Localizar sorteio
          </strong>
        </div>

        <div
          className="clean-lottery-selector"
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

        <form
          className="clean-search-form"
          onSubmit={handleSearch}
        >
          <div className="clean-search-type">
            <button
              type="button"
              className={
                searchType === "contest"
                  ? "clean-search-type-active"
                  : ""
              }
              onClick={() =>
                setSearchType("contest")
              }
            >
              Por concurso
            </button>

            <button
              type="button"
              className={
                searchType === "date"
                  ? "clean-search-type-active"
                  : ""
              }
              onClick={() =>
                setSearchType("date")
              }
            >
              Por data
            </button>
          </div>

          <div className="clean-search-fields">
            <div>
              <label htmlFor="official-result-search">
                {searchType === "contest"
                  ? "Número do concurso"
                  : "Data do sorteio"}
              </label>

              {searchType === "contest" ? (
                <input
                  id="official-result-search"
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
              ) : (
                <input
                  id="official-result-search"
                  type="date"
                  value={dateInput}
                  onChange={(event) =>
                    setDateInput(
                      event.target.value,
                    )
                  }
                />
              )}
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={searching}
            >
              {searching
                ? "Buscando..."
                : "Buscar resultado"}
            </button>
          </div>

          <small>
            Modalidade selecionada:{" "}
            <strong>
              {selectedLottery.name}
            </strong>
          </small>
        </form>
      </section>

      {searchMode && (
        <div className="clean-search-result-heading">
          <div>
            <span>Resultado da busca</span>

            <strong>
              {selectedLottery.name}
            </strong>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={returnToLatest}
          >
            Voltar aos últimos resultados
          </button>
        </div>
      )}

      {loading && !searchMode && (
        <div className="results-loading">
          <strong>
            Carregando resultados oficiais
          </strong>

          <p>
            Consultando os últimos concursos.
          </p>
        </div>
      )}

      {error && (
        <div
          className="results-loading results-loading-error"
          role="alert"
        >
          <strong>
            Resultado não localizado
          </strong>

          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !searchMode &&
        latestResults.length > 0 && (
          <>
            <div className="clean-section-title">
              <span>Últimos sorteios</span>

              <strong>
                Um resultado por modalidade
              </strong>
            </div>

            <div className="clean-results-grid">
              {latestResults.map(
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
          </>
        )}

      {searchMode &&
        !error &&
        searchResults.length > 0 && (
          <div className="clean-results-grid clean-results-grid-search">
            {searchResults.map(
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
        )}

      {searchMode &&
        !error &&
        searchResults.length === 0 && (
          <div className="results-loading">
            <strong>
              Nenhum sorteio encontrado
            </strong>

            <p>
              Não há resultado da{" "}
              {selectedLottery.name} para a
              consulta informada.
            </p>
          </div>
        )}
    </section>
  );
}
