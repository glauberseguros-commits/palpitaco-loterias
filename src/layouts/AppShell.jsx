import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/", label: "Início", icon: "⌂", end: true },
  { to: "/analises", label: "Análises", icon: "01" },
  { to: "/probabilidades", label: "Probabilidades", icon: "02" },
  { to: "/geradores", label: "Geradores", icon: "03" },
  { to: "/resultados", label: "Resultados", icon: "04" },
];

export default function AppShell({ children }) {
  return (
    <div className="application-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/" end>
          <span className="brand-mark">PL</span>

          <span className="brand-copy">
            <strong>PALPITACO</strong>
            <small>LOTERIAS</small>
          </span>
        </NavLink>

        <nav className="sidebar-navigation" aria-label="Navegação principal">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `navigation-item${isActive ? " navigation-item-active" : ""}`
              }
            >
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
            </NavLink>
          ))}
        </nav>

        <NavLink className="account-link" to="/conta">
          <span className="account-avatar">PL</span>

          <span>
            <strong>Minha conta</strong>
            <small>Perfil e preferências</small>
          </span>
        </NavLink>
      </aside>

      <div className="application-content">
        <header className="topbar">
          <div>
            <span className="topbar-label">Produto</span>
            <strong>Palpitaco Loterias</strong>
          </div>

          <a className="back-link" href="/">
            Voltar ao Palpitaco
          </a>
        </header>

        <main className="main-content">{children}</main>
      </div>

      <nav className="bottom-navigation" aria-label="Navegação móvel">
        {navigation.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `bottom-navigation-item${
                isActive ? " bottom-navigation-item-active" : ""
              }`
            }
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
