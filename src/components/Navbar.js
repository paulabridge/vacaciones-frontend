import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar({ title = 'Sistema de Vacaciones' }) {
  const navigate = useNavigate();
  const gerente = JSON.parse(localStorage.getItem('gerente') || 'null');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('gerente');
    navigate('/gerente/login');
  }

  return (
    <div className="navbar">
      <h1>🏖️ {title}</h1>
      {gerente && (
        <>
          <Link to="/gerente/panel">Mis pedidos</Link>
          <Link to="/gerente/calendario">Calendario</Link>
          {gerente.es_admin && <Link to="/gerente/admin">Administración</Link>}
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{gerente.nombre}</span>
          <button onClick={logout}>Salir</button>
        </>
      )}
    </div>
  );
}
