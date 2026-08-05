import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard/Dashboard";
import Analises from "./pages/Analises/Analises";
import Probabilidades from "./pages/Probabilidades/Probabilidades";
import Geradores from "./pages/Geradores/Geradores";
import Resultados from "./pages/Resultados/Resultados";
import Conta from "./pages/Conta/Conta";
import "./App.css";

function ApplicationRoutes() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <Routes>
        <Route
          path="/"
          element={<Dashboard onNavigate={(route) => navigate(route)} />}
        />
        <Route path="/analises" element={<Analises />} />
        <Route path="/probabilidades" element={<Probabilidades />} />
        <Route path="/geradores" element={<Geradores />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/conta" element={<Conta />} />
        <Route
          path="*"
          element={<Dashboard onNavigate={(route) => navigate(route)} />}
        />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/loterias">
      <ApplicationRoutes />
    </BrowserRouter>
  );
}
