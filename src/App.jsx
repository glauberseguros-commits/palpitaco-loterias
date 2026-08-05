import "./App.css";

const LOTTERIES = [
  "Lotofácil",
  "Mega-Sena",
  "Quina",
  "Lotomania"
];

const RESULT = [
  "03","05","08","09","12",
  "14","15","17","18","21",
  "22","23","24","25","11"
];

export default function App() {
  return (
    <main className="app">

      <header className="hero">
        <h1>PALPITACO LOTERIAS</h1>
        <p>
          Inteligência para Loterias Oficiais
        </p>
      </header>

      <section className="tabs">
        {LOTTERIES.map(item=>(
          <button key={item}>
            {item}
          </button>
        ))}
      </section>

      <section className="grid">

        <article className="card">

          <h2>Último Resultado</h2>

          <div className="balls">
            {RESULT.map(n=>(
              <span key={n}>{n}</span>
            ))}
          </div>

          <div className="info">
            <strong>Concurso</strong>
            <span>Exemplo</span>
          </div>

          <div className="info">
            <strong>Próximo prêmio</strong>
            <span>Em breve</span>
          </div>

        </article>

        <article className="card">

          <h2>Gerador Inteligente</h2>

          <p>
            Em breve será integrado ao motor estatístico do
            Palpitaco Loterias.
          </p>

          <button className="primary">
            Gerar Jogo
          </button>

        </article>

      </section>

    </main>
  );
}
