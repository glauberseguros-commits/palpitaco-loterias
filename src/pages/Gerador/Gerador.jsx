import {
  useMemo,
  useState,
} from "react";

import {
  LOTTERY_CATALOG,
} from "../../data/lotteries";

const MIN_GAMES = 1;
const MAX_GAMES = 20;

function getSecureRandomIndex(
  maximum,
) {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues ===
      "function"
  ) {
    const values =
      new Uint32Array(1);

    globalThis.crypto.getRandomValues(
      values,
    );

    return values[0] % maximum;
  }

  return Math.floor(
    Math.random() * maximum,
  );
}

function formatNumber(
  number,
) {
  return String(number).padStart(
    2,
    "0",
  );
}

function generateSingleGame(
  lottery,
) {
  const pool = [];

  for (
    let number = lottery.minNumber;
    number <= lottery.maxNumber;
    number += 1
  ) {
    pool.push(number);
  }

  for (
    let index = pool.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      getSecureRandomIndex(
        index + 1,
      );

    [
      pool[index],
      pool[randomIndex],
    ] = [
      pool[randomIndex],
      pool[index],
    ];
  }

  return pool
    .slice(0, lottery.drawSize)
    .sort(
      (first, second) =>
        first - second,
    )
    .map(formatNumber);
}

function generateGames(
  lottery,
  amount,
) {
  const uniqueGames =
    new Map();

  let attempts = 0;
  const maximumAttempts =
    amount * 100;

  while (
    uniqueGames.size < amount &&
    attempts < maximumAttempts
  ) {
    const game =
      generateSingleGame(
        lottery,
      );

    uniqueGames.set(
      game.join("-"),
      game,
    );

    attempts += 1;
  }

  return Array.from(
    uniqueGames.values(),
  );
}

export default function Gerador() {
  const [
    selectedLotteryKey,
    setSelectedLotteryKey,
  ] = useState(
    LOTTERY_CATALOG[0].key,
  );

  const [
    amount,
    setAmount,
  ] = useState(1);

  const [
    games,
    setGames,
  ] = useState([]);

  const [
    copyStatus,
    setCopyStatus,
  ] = useState("");

  const selectedLottery =
    useMemo(
      () =>
        LOTTERY_CATALOG.find(
          (lottery) =>
            lottery.key ===
            selectedLotteryKey,
        ) ||
        LOTTERY_CATALOG[0],
      [selectedLotteryKey],
    );

  function clearGeneration() {
    setGames([]);
    setCopyStatus("");
  }

  function selectLottery(
    lotteryKey,
  ) {
    setSelectedLotteryKey(
      lotteryKey,
    );

    clearGeneration();
  }

  function handleAmountChange(
    event,
  ) {
    const nextAmount =
      Number(event.target.value);

    if (
      !Number.isInteger(nextAmount)
    ) {
      return;
    }

    setAmount(
      Math.min(
        MAX_GAMES,
        Math.max(
          MIN_GAMES,
          nextAmount,
        ),
      ),
    );

    clearGeneration();
  }

  function handleGenerate() {
    setGames(
      generateGames(
        selectedLottery,
        amount,
      ),
    );

    setCopyStatus("");
  }

  async function handleCopy() {
    if (games.length === 0) {
      return;
    }

    const content =
      games
        .map(
          (game, index) =>
            `Jogo ${index + 1}: ` +
            game.join(" "),
        )
        .join("\n");

    try {
      await navigator.clipboard.writeText(
        content,
      );

      setCopyStatus(
        "Jogos copiados.",
      );
    } catch {
      setCopyStatus(
        "Não foi possível copiar automaticamente.",
      );
    }
  }

  return (
    <section className="page generator-page">
      <header className="page-header generator-page-header">
        <span className="eyebrow">
          Combinações
        </span>

        <h1>Gerador</h1>

        
      </header>

      <section className="generator-config-panel">
        <div className="generator-panel-heading">
          <div>
            <span>
              Configuração
            </span>

            <h2>
              Monte sua geração
            </h2>
          </div>

          <strong>
            {selectedLottery.name}
          </strong>
        </div>

        <div
          className="generator-lottery-selector"
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
                    ? "generator-lottery-button generator-lottery-button-active"
                    : "generator-lottery-button"
                }
                onClick={() =>
                  selectLottery(
                    lottery.key,
                  )
                }
              >
                <span>
                  {lottery.name}
                </span>

                <small>
                  {lottery.drawSize} dezenas
                </small>
              </button>
            ),
          )}
        </div>

        <div className="generator-rule-summary">
          <div>
            <span>
              Universo
            </span>

            <strong>
              {formatNumber(
                selectedLottery.minNumber,
              )}
              {" — "}
              {formatNumber(
                selectedLottery.maxNumber,
              )}
            </strong>
          </div>

          <div>
            <span>
              Dezenas por jogo
            </span>

            <strong>
              {selectedLottery.drawSize}
            </strong>
          </div>

          
        </div>

        <div className="generator-controls">
          <div className="generator-amount-field">
            <label htmlFor="generator-amount">
              Quantidade de jogos
            </label>

            <div>
              <button
                type="button"
                aria-label="Diminuir quantidade"
                onClick={() => {
                  setAmount(
                    (current) =>
                      Math.max(
                        MIN_GAMES,
                        current - 1,
                      ),
                  );

                  clearGeneration();
                }}
                disabled={
                  amount <= MIN_GAMES
                }
              >
                −
              </button>

              <input
                id="generator-amount"
                type="number"
                min={MIN_GAMES}
                max={MAX_GAMES}
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={
                  handleAmountChange
                }
              />

              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={() => {
                  setAmount(
                    (current) =>
                      Math.min(
                        MAX_GAMES,
                        current + 1,
                      ),
                  );

                  clearGeneration();
                }}
                disabled={
                  amount >= MAX_GAMES
                }
              >
                +
              </button>
            </div>

            <small>
              Limite de {MAX_GAMES} jogos
              por geração.
            </small>
          </div>

          <button
            type="button"
            className="generator-primary-button"
            onClick={handleGenerate}
          >
            {games.length > 0
              ? "Gerar novamente"
              : "Gerar jogos"}
          </button>
        </div>
      </section>

      {games.length === 0 ? (
        <section className="generator-empty-state">
          <span className="generator-empty-symbol">
            PL
          </span>

          <div>
            <strong>
              Nenhum jogo gerado
            </strong>

            <p>
              Escolha a modalidade e a
              quantidade para iniciar.
            </p>
          </div>
        </section>
      ) : (
        <section className="generator-results">
          <div className="generator-results-heading">
            <div>
              <span>
                Jogos gerados
              </span>

              <strong>
                {games.length}{" "}
                {games.length === 1
                  ? "combinação"
                  : "combinações"}
              </strong>
            </div>

            <div className="generator-result-actions">
              {copyStatus && (
                <small>
                  {copyStatus}
                </small>
              )}

              <button
                type="button"
                onClick={handleCopy}
              >
                Copiar todos
              </button>
            </div>
          </div>

          <div className="generator-games-list">
            {games.map(
              (game, gameIndex) => (
                <article
                  key={game.join("-")}
                  className="generator-game-card"
                >
                  <header>
                    <span>
                      Jogo{" "}
                      {String(
                        gameIndex + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <small>
                      {selectedLottery.name}
                    </small>
                  </header>

                  <div
                    className="generator-game-numbers"
                    aria-label={
                      `Jogo ${gameIndex + 1}`
                    }
                  >
                    {game.map(
                      (number) => (
                        <span
                          key={number}
                        >
                          {number}
                        </span>
                      ),
                    )}
                  </div>
                </article>
              ),
            )}
          </div>

          
        </section>
      )}
    </section>
  );
}



