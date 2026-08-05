import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/", label: "Início", code: "01", end: true },
  { to: "/resultados", label: "Resultados", code: "02" },
  { to: "/gerador", label: "Gerador", code: "03" },
  { to: "/estatisticas", label: "Estatísticas", code: "04" },
  { to: "/conferencia", label: "Conferência", code: "05" },
];

export default function AppShell({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" end className="brand">
          <span className="brand-symbol">PL</span>

          <span className="brand-text">
            <strong>PALPITACO</strong>
            <small>LOTERIAS</small>
          </span>
        </NavLink>

        <nav className="main-navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
            >
              <span>{item.code}</span>
              <strong>{item.label}</strong>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/conta" className="account-card">
          <span>PL</span>

          <div>
            <strong>Minha conta</strong>
            <small>Perfil e preferências</small>
          </div>
        </NavLink>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <small>Produto</small>
            <strong>Palpitaco Loterias</strong>
          </div>

          <a href="/" className="portal-link">
            Voltar ao portal
          </a>
        </header>

        <main className="content">{children}</main>
      </div>

      <nav className="mobile-navigation">
        {navigation.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? "mobile-item mobile-item-active" : "mobile-item"
            }
          >
            <span>{item.code}</span>
            <small>{item.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
