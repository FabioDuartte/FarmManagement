import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  PiggyBank,
  Wheat, 
  Milk,
  TrendingUp,
  FileText,
  LogOut
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import Animais from './pages/Animais';
import Negociacoes from './pages/Negociacoes';
import Clientes from './pages/Clientes';
import Financas from './pages/Financas';
import Milho from './pages/Milho';
import Ordenha from './pages/Ordenha';
import Relatorios from './pages/Relatorios';

function AppContent() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <h1>
            <span>🌾</span>
            FazendaControl
          </h1>
          <span>Sistema de Gestão Rural</span>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Principal</div>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard />
            Dashboard
          </NavLink>
          <NavLink to="/negociacoes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <ShoppingCart />
            Negociações
          </NavLink>
          <NavLink to="/animais" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <TrendingUp />
            Animais
          </NavLink>
          <NavLink to="/clientes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Users />
            Clientes/Fornecedores
          </NavLink>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Operações</div>
          <NavLink to="/milho" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Wheat />
            Plantação de Milho
          </NavLink>
          <NavLink to="/ordenha" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Milk />
            Ordenha
          </NavLink>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Financeiro</div>
          <NavLink to="/financas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <PiggyBank />
            Finanças
          </NavLink>
          <NavLink to="/relatorios" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <FileText />
            Relatórios
          </NavLink>
        </div>

        <div className="nav-section" style={{ marginTop: 'auto' }}>
          <button className="nav-item" onClick={logout} style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}>
            <LogOut />
            Sair
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/animais" element={<Animais />} />
          <Route path="/negociacoes" element={<Negociacoes />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/milho" element={<Milho />} />
          <Route path="/ordenha" element={<Ordenha />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
