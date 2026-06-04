// PedidoExitoso.js
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export function PedidoExitoso() {
  const { state } = useLocation();
  return (
    <div>
      <div className="navbar"><h1>🏖️ Sistema de Vacaciones</h1></div>
      <div className="container">
        <div className="success-wrap">
          <div className="success-icon">✅</div>
          <h2 style={{ color: '#1E3A5F', marginBottom: 12 }}>¡Pedido enviado!</h2>
          <p style={{ color: '#555', marginBottom: 24 }}>Tu pedido fue recibido. El gerente recibirá una notificación y te avisaremos por mail cuando responda.</p>
          {state?.advertencia && (
            <div className="alert alert-warning" style={{ maxWidth: 500, margin: '0 auto 20px' }}>
              ⚠️ {state.advertencia}
            </div>
          )}
          <Link to="/" className="btn btn-outline">Hacer otro pedido</Link>
        </div>
      </div>
    </div>
  );
}

export default PedidoExitoso;
