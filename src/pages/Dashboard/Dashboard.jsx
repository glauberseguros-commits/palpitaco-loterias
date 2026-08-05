import { LOTTERY_CATALOG } from "../../data/lotteries";

export default function Dashboard() {
  return (
    <section className="page">
      <header className="page-header">
        <span className="eyebrow">Visão geral</span>
        <h1>Palpitaco Loterias</h1>
        <p>
          Resultados oficiais, análises, estatísticas, geradores e conferência
          em um único ambiente.
        </p>
      </header>

      <div className="lottery-selector">
        {LOTTERY_CATALOG.map((lottery, index) => (
          <button
            key={lottery.key}
            type="button"
            className={index === 0 ? "lottery-tab lottery-tab-active" : "lottery-tab"}
          >
            {lottery.name}
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">Fonte oficial</span>
              <h2>Último resultado</h2>
            </div>

            <span className="status-badge">Aguardando integração</span>
          </div>

          <div className="official-source">
            <strong>Loterias CAIXA</strong>
            <p>
              O importador oficial ainda será implementado. Nenhum resultado
              demonstrativo será apresentado como dado real.
            </p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">Ferramenta</span>
              <h2>Gerador inteligente</h2>
            </div>
          </div>

          <div className="empty-module">
            <strong>Motor ainda não implementado</strong>
            <p>
              O gerador será construído com regras específicas para cada
              modalidade e métricas claramente identificadas.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
