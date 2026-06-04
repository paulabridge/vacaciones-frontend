import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import NuevoPedido from './pages/NuevoPedido';
import PedidoExitoso from './pages/PedidoExitoso';
import Login from './pages/Login';
import PanelGerente from './pages/PanelGerente';
import ResolverPedido from './pages/ResolverPedido';
import Calendario from './pages/Calendario';
import PanelAdmin from './pages/PanelAdmin';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const gerente = JSON.parse(localStorage.getItem('gerente') || 'null');
  if (!token || !gerente) return <Navigate to="/gerente/login" />;
  if (adminOnly && !gerente.es_admin) return <Navigate to="/gerente/panel" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NuevoPedido />} />
        <Route path="/pedido-exitoso" element={<PedidoExitoso />} />
        <Route path="/aprobar/:token" element={<ResolverPedido />} />
        <Route path="/gerente/login" element={<Login />} />
        <Route path="/gerente/panel" element={<ProtectedRoute><PanelGerente /></ProtectedRoute>} />
        <Route path="/gerente/calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
        <Route path="/gerente/admin" element={<ProtectedRoute adminOnly><PanelAdmin /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
