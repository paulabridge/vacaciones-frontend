import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function fmt(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ResolverPedido() {
  const { token } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accion, setAccion] = useState(''); // aprobado | rechazado | a_revisar
  const [reemplazante, setReemplazante] = useState('');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resuelto, setResuelto] = useState(false);

  useEffect(() => {
    api.get(`/pedidos/token/${token}`)
      .then(r => { setPedido(r.data); if (r.data.estado !== 'pendiente') setResuelto(true); })
      .catch(() => setError('Pedido no encontrado o link inválido.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function resolver(estado) {
    setAccion(estado);
    setGuardando(true);
    try {
      await api.post(`/pedidos/${pedido.id}/resolver`, { estado, reemplazante, comentario_gerente: comentario, token });
      setResuelto(true);
      setAccion(estado);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (error) return <div style={{ padding: 40 }}><div className="alert alert-error">{error}</div></div>;

  const estadoLabels = { aprobado: '✅ Aprobado', rechazado: '❌ Rechazado', a_revisar: '💬 Enviado con comentarios' };

  return (
    <div>
      <div className="navbar"><h1>🏖️ Sistema de Vacaciones</h1></div>
      <div className="container" style={{ maxWidth: 600, paddingTop: 32 }}>
        {resuelto ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {accion === 'aprobado' || pedido.estado === 'aprobado' ? '✅' : accion === 'rechazado' || pedido.estado === 'rechazado' ? '❌' : '💬'}
            </div>
            <h2>{estadoLabels[accion || pedido.estado] || 'Pedido ya resuelto'}</h2>
            <p style={{ color: '#666', marginTop: 8 }}>El empleado fue notificado por mail.</p>
            <p style={{ marginTop: 20 }}><a href="/gerente/panel" className="btn btn-outline">Ir al panel de gerente</a></p>
          </div>
        ) : (
          <div className="card">
            <h2>Pedido de vacaciones</h2>
            <div className="pedido-detalle">
              <div className="field"><span className="field-label">Empleado</span><span>{pedido.empleado_nombre}</span></div>
              <div className="field"><span className="field-label">Empresa</span><span>{pedido.empresa_nombre}</span></div>
              <div className="field"><span className="field-label">Desde</span><span>{fmt(pedido.fecha_inicio)}</span></div>
              <div className="field"><span className="field-label">Hasta</span><span>{fmt(pedido.fecha_fin)}</span></div>
              <div className="field"><span className="field-label">Días hábiles</span><span><strong>{pedido.dias_habiles}</strong></span></div>
              {pedido.comentario_empleado && <div className="field"><span className="field-label">Comentario</span><span>{pedido.comentario_empleado}</span></div>}
            </div>

            <div className="form-group">
              <label>Reemplazante (opcional)</label>
              <input value={reemplazante} onChange={e => setReemplazante(e.target.value)} placeholder="Nombre de quien lo reemplaza" />
            </div>
            <div className="form-group">
              <label>Comentario para el empleado (opcional)</label>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Podés agregar una aclaración o motivo..." />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="actions">
              <button className="btn btn-success" onClick={() => resolver('aprobado')} disabled={guardando}>✅ Aprobar</button>
              <button className="btn btn-danger" onClick={() => resolver('rechazado')} disabled={guardando}>❌ Rechazar</button>
              <button className="btn btn-warning" onClick={() => resolver('a_revisar')} disabled={guardando}>💬 Dejar comentarios</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
