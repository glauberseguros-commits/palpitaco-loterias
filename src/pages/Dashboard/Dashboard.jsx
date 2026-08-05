const modules = [
  {
    number: "01",
    title: "Análises",
    description: "Leitura estruturada de concursos, padrões e indicadores.",
    route: "/analises",
  },
  {
    number: "02",
    title: "Probabilidades",
    description: "Frequências, tendências e cenários estatísticos.",
    route: "/probabilidades",
  },
  {
    number: "03",
    title: "Geradores",
    description: "Ferramentas para criação e organização de combinações.",
    route: "/geradores",
  },
  {
    number: "04",
    title: "Resultados",
    description: "Conferência, histórico e acompanhamento de concursos.",
    route: "/resultados",
  },
];

export default function Dashboard({ onNavigate }) {
  return (
    <section className="page-section">
      <header className="page-heading">
        <p className="eyebrow">Visão geral</p>
        <h1>Palpitaco Loterias</h1>
        <p>
          Inteligência aplicada às loterias oficiais, com informações,
          probabilidades e ferramentas organizadas em um único ambiente.
        </p>
      </header>

      <div className="module-grid">
        {modules.map((module) => (
          <button
            type="button"
            className="module-card"
            key={module.route}
            onClick={() => onNavigate(module.route)}
          >
            <span className="module-number">{module.number}</span>

            <span className="module-content">
              <strong>{module.title}</strong>
              <small>{module.description}</small>
            </span>

            <span className="module-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>

      <aside className="status-card">
        <div>
          <span className="status-dot" aria-hidden="true" />
          <strong>Estrutura inicial disponível</strong>
        </div>

        <p>
          A navegação-base está pronta. Nenhuma regra de negócio ou cálculo
          de loteria foi implementado nesta etapa.
        </p>
      </aside>
    </section>
  );
}
