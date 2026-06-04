import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

function fmt(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const EMPRESA_COLORES = { 'Volkswagen': '#2563EB', 'Turenne': '#EA580C', 'Chevrolet': '#CA8A04', 'Chery': '#DC2626', 'Audi': '#1C1C1C', 'Multimarca': '#7C3AED' };

export default function PanelGerente() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('pendiente');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reemplazante, setReemplazante] = useState('');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await api.get('/pedidos/mis-pedidos');
      setPedidos(data);
    } catch {}
    setLoading(false);
  }

  const filtrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtro);
  const pendientesCount = pedidos.filter(p => p.estado === 'pendiente').length;

  async function resolver(estado) {
    setGuardando(true);
    try {
      await api.post(`/pedidos/${selected.id}/resolver`, { estado, reemplazante, comentario_gerente: comentario });
      setMsg(`Pedido ${estado === 'aprobado' ? 'aprobado' : estado === 'rechazado' ? 'rechazado' : 'actualizado'} correctamente.`);
      setSelected(null);
      cargar();
    } catch (e) {
      setMsg('Error al guardar: ' + (e.response?.data?.error || ''));
    }
    setGuardando(false);
  }

  function abrirPedido(p) {
    setSelected(p);
    setReemplazante(p.reemplazante || '');
    setComentario(p.comentario_gerente || '');
    setMsg('');
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <h2 className="page-title" style={{ margin: 0 }}>Panel de aprobaciones</h2>
          {pendientesCount > 0 && <span className="badge badge-pendiente">{pendientesCount} pendiente{pendientesCount > 1 ? 's' : ''}</span>}
        </div>

        {msg && <div className={`alert ${msg.includes('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

        <div className="tabs">
          {[['pendiente','Pendientes'],['aprobado','Aprobados'],['rechazado','Rechazados'],['a_revisar','A revisar'],['todos','Todos']].map(([v,l]) => (
            <button key={v} className={`tab-btn ${filtro === v ? 'active' : ''}`} onClick={() => setFiltro(v)}>{l}</button>
          ))}
        </div>

        {selected && (
          <div className="card" style={{ border: '2px solid #1E3A5F' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: 18 }}>Resolver pedido de {selected.empleado_nombre}</h2>
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => setSelected(null)}>✕ Cerrar</button>
            </div>
            <div className="pedido-detalle" style={{ marginTop: 16 }}>
              <div className="field"><span className="field-label">Empresa</span><span><span className="empresa-dot" style={{ background: EMPRESA_COLORES[selected.empresa_nombre] || '#888' }}></span>{selected.empresa_nombre}</span></div>
              <div className="field"><span className="field-label">Desde</span><span>{fmt(selected.fecha_inicio)}</span></div>
              <div className="field"><span className="field-label">Hasta</span><span>{fmt(selected.fecha_fin)}</span></div>
              <div className="field"><span className="field-label">Días hábiles</span><span><strong>{selected.dias_habiles}</strong></span></div>
              {selected.comentario_empleado && <div className="field"><span className="field-label">Comentario</span><span>{selected.comentario_empleado}</span></div>}
            </div>
            <div className="form-group">
              <label>Reemplazante (opcional)</label>
              <input value={reemplazante} onChange={e => setReemplazante(e.target.value)} placeholder="Nombre de quien lo reemplaza" />
            </div>
            <div className="form-group">
              <label>Comentario para el empleado (opcional)</label>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Aclaración o motivo..." />
            </div>
            <div className="actions">
              <button className="btn btn-success" onClick={() => resolver('aprobado')} disabled={guardando}>✅ Aprobar</button>
              <button className="btn btn-danger" onClick={() => resolver('rechazado')} disabled={guardando}>❌ Rechazar</button>
              <button className="btn btn-warning" onClick={() => resolver('a_revisar')} disabled={guardando}>💬 Dejar comentarios</button>
            </div>
          </div>
        )}

        <div className="card">
          {loading ? <p>Cargando...</p> : filtrados.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>No hay pedidos en esta categoría.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Empresa</th>
                    <th>Gerente</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Días</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => (
                    <tr key={p.id}>
                      <td>{p.empleado_nombre}</td>
                      <td><span className="empresa-dot" style={{ background: EMPRESA_COLORES[p.empresa_nombre] || '#888' }}></span>{p.empresa_nombre}</td>
                      <td>{p.gerente_nombre}</td>
                      <td>{fmt(p.fecha_inicio)}</td>
                      <td>{fmt(p.fecha_fin)}</td>
                      <td><strong>{p.dias_habiles}</strong></td>
                      <td><span className={`badge badge-${p.estado}`}>{p.estado === 'a_revisar' ? 'a revisar' : p.estado}</span></td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => abrirPedido(p)}>
                          {p.estado === 'pendiente' ? 'Resolver' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
