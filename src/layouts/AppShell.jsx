import {
  NavLink,
} from "react-router-dom";

const navigation = [
  {
    to: "/",
    label: "Início",
    number: "01",
    end: true,
  },
  {
    to: "/resultados",
    label: "Resultados",
    number: "02",
  },
  {
    to: "/gerador",
    label: "Gerador",
    number: "03",
  },
  {
    to: "/estatisticas",
    label: "Estatísticas",
    number: "04",
  },
  {
    to: "/conferencia",
    label: "Conferência",
    number: "05",
  },
];

function navigationClass({
  isActive,
}) {
  return (
    "premium-top-navigation-item" +
    (
      isActive
        ? " premium-top-navigation-item-active"
        : ""
    )
  );
}

function mobileNavigationClass({
  isActive,
}) {
  return (
    "bottom-navigation-item" +
    (
      isActive
        ? " bottom-navigation-item-active"
        : ""
    )
  );
}

export default function AppShell({
  children,
}) {
  return (
    <div className="application-shell premium-top-shell">
      <header className="premium-application-header">
        <div className="premium-header-inner">
          <NavLink
            className="premium-header-brand"
            to="/"
            end
            aria-label="Palpitaco Loterias — Início"
          >
            <span className="premium-header-brand-mark">
              PL
            </span>

            <span className="premium-header-brand-copy">
              <strong>PALPITACO</strong>
              <small>LOTERIAS</small>
            </span>
          </NavLink>

          <nav
            className="premium-top-navigation"
            aria-label="Navegação principal"
          >
            {navigation.map(
              (item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navigationClass}
                >
                  <span>{item.number}</span>
                  <strong>{item.label}</strong>
                </NavLink>
              ),
            )}
          </nav>

          <div className="premium-header-actions">
            <NavLink
              className="premium-account-link"
              to="/conta"
            >
              <span className="premium-account-avatar">
                PL
              </span>

              <span className="premium-account-copy">
                <strong>Minha conta</strong>
                <small>Perfil</small>
              </span>
            </NavLink>

            <a
              className="back-link premium-portal-link"
              href="/"
            >
              Voltar ao portal
            </a>
          </div>
        </div>
      </header>

      <div className="application-content premium-application-content">
        <main className="main-content premium-main-content">
          {children}
        </main>
      </div>

      <nav
        className="bottom-navigation premium-mobile-navigation"
        aria-label="Navegação móvel"
      >
        {navigation
          .slice(0, 4)
          .map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileNavigationClass}
              >
                <span>{item.number}</span>
                <small>{item.label}</small>
              </NavLink>
            ),
          )}
      </nav>
    </div>
  );
}
