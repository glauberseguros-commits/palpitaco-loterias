import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard/Dashboard";
import Resultados from "./pages/Resultados/Resultados";
import Gerador from "./pages/Gerador/Gerador";
import Estatisticas from "./pages/Estatisticas/Estatisticas";
import Conferencia from "./pages/Conferencia/Conferencia";
import Conta from "./pages/Conta/Conta";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter basename="/loterias">
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/gerador" element={<Gerador />} />
          <Route path="/estatisticas" element={<Estatisticas />} />
          <Route path="/conferencia" element={<Conferencia />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
