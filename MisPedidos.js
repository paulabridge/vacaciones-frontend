import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const EMPRESAS = [
  { id: 1, nombre: 'Volkswagen' },
  { id: 2, nombre: 'Turenne' },
  { id: 3, nombre: 'Chevrolet' },
  { id: 4, nombre: 'Chery' },
  { id: 5, nombre: 'Audi' },
  { id: 6, nombre: 'Multimarca' },
];

const EMPRESA_COLORES = { 'Volkswagen': '#2563EB', 'Turenne': '#EA580C', 'Chevrolet': '#CA8A04', 'Chery': '#DC2626', 'Audi': '#1C1C1C', 'Multimarca': '#7C3AED' };

function fmt(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcDias(inicio, fin, feriados) {
  if (!inicio || !fin) return 0;
  const feriadoSet = new Set(feriados);
  let dias = 0;
  const cur = new Date(inicio + 'T00:00:00');
  const end = new Date(fin + 'T00:00:00');
  while (cur <= end) {
    const dow = cur.getDay();
    const str = cur.toISOString().split('T')[0];
    if (dow !== 0 && !feriadoSet.has(str)) dias++;
    cur.setDate(cur.getDate() + 1);
  }
  return dias;
}

export default function MisPedidos() {
  const [email, setEmail] = useState('');
  const [emailBuscado, setEmailBuscado] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [gerentes, setGerentes] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [dias, setDias] = useState(0);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/gerentes').then(r => setGerentes(r.data));
    api.get('/admin/feriados').then(r => setFeriados(r.data.map(f => f.fecha.split('T')[0]))).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.fecha_inicio && form.fecha_fin) {
      setDias(calcDias(form.fecha_inicio, form.fecha_fin, feriados));
    }
  }, [form.fecha_inicio, form.fecha_fin, feriados]);

  async function buscar(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(''); setError('');
    try {
      const { data } = await api.post('/pedidos/mis-pedidos', { email });
      setPedidos(data);
      setEmailBuscado(email);
      if (data.length === 0) setMsg('No encontramos pedidos para ese mail.');
    } catch {
      setError('Error al buscar pedidos.');
    }
    setLoading(false);
  }

  function abrirEdicion(p) {
    setEditando(p.id);
    setForm({
      fecha_inicio: p.fecha_inicio.split('T')[0],
      fecha_fin: p.fecha_fin.split('T')[0],
      comentario_empleado: p.comentario_empleado || '',
      empresa_id: p.empresa_id,
      gerente_id: p.gerente_id,
    });
    setDias(p.dias_habiles);
    setMsg(''); setError('');
  }

  async function guardarEdicion(id) {
    if (dias <= 0) return setError('Las fechas no tienen días hábiles válidos.');
    setGuardando(true);
    try {
      await api.put(`/pedidos/${id}`, { empleado_email: emailBuscado, ...form, empresa_id: parseInt(form.empresa_id), gerente_id: parseInt(form.gerente_id) });
      setMsg('Pedido actualizado. El gerente fue notificado.');
      setEditando(null);
      const { data } = await api.post('/pedidos/mis-pedidos', { email: emailBuscado });
      setPedidos(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar.');
    }
    setGuardando(false);
  }

  async function cancelarPedido(id) {
    if (!window.confirm('¿Seguro que querés cancelar este pedido?')) return;
    try {
      await api.delete(`/pedidos/${id}`, { data: { empleado_email: emailBuscado } });
      setMsg('Pedido cancelado.');
      const { data } = await api.post('/pedidos/mis-pedidos', { email: emailBuscado });
      setPedidos(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cancelar.');
    }
  }

  const editable = (estado) => ['pendiente', 'a_revisar'].includes(estado);
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="navbar">
        <h1>🏖️ Sistema de Vacaciones</h1>
        <a href="/" style={{ color: '#fff', fontSize: 13, opacity: .7 }}>Nuevo pedido</a>
        <a href="/gerente/login" style={{ color: '#fff', fontSize: 13, opacity: .7 }}>Acceso gerentes</a>
      </div>
      <div className="container" style={{ maxWidth: 700, paddingTop: 32 }}>
        <div className="card">
          <h2>Mis pedidos de vacaciones</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Ingresá tu mail para ver y gestionar tus pedidos.</p>
          <form onSubmit={buscar} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@mail.com" style={{ flex: 1, padding: '10px 12px', border: '1px solid #d0d7e3', borderRadius: 6, fontSize: 14 }} />
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
          </form>

          {msg && <div className="alert alert-success">{msg}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {pedidos.length > 0 && (
            <div>
              {pedidos.map(p => (
                <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  {editando === p.id ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <strong style={{ color: '#1E3A5F' }}>Editando pedido</strong>
                        <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>✕</button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Empresa *</label>
                          <select value={form.empresa_id} onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))} required>
                            {EMPRESAS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Gerente responsable *</label>
                          <select value={form.gerente_id} onChange={e => setForm(f => ({ ...f, gerente_id: e.target.value }))} required>
                            {gerentes.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Fecha de inicio *</label>
                          <input type="date" value={form.fecha_inicio} min={hoy} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label>Fecha de fin *</label>
                          <input type="date" value={form.fecha_fin} min={form.fecha_inicio || hoy} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} required />
                        </div>
                      </div>
                      {dias > 0 && (
                        <div className="dias-calc">
                          <div className="num">{dias}</div>
                          <div className="label">días hábiles</div>
                        </div>
                      )}
                      <div className="form-group">
                        <label>Comentarios (opcional)</label>
                        <textarea value={form.comentario_empleado} onChange={e => setForm(f => ({ ...f, comentario_empleado: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-primary" onClick={() => guardarEdicion(p.id)} disabled={guardando}>
                          {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button className="btn btn-outline" onClick={() => setEditando(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <span className="empresa-dot" style={{ background: EMPRESA_COLORES[p.empresa_nombre] || '#888' }}></span>
                          <strong>{p.empresa_nombre}</strong>
                          <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>→ {p.gerente_nombre}</span>
                        </div>
                        <span className={`badge badge-${p.estado}`}>{p.estado === 'a_revisar' ? 'a revisar' : p.estado}</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#444', marginBottom: 8 }}>
                        {fmt(p.fecha_inicio)} → {fmt(p.fecha_fin)} · <strong>{p.dias_habiles} días hábiles</strong>
                      </div>
                      {p.comentario_empleado && <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Tu comentario: {p.comentario_empleado}</div>}
                      {p.comentario_gerente && (
                        <div style={{ background: '#fef9ee', border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 8 }}>
                          💬 <strong>Comentario del gerente:</strong> {p.comentario_gerente}
                        </div>
                      )}
                      {p.reemplazante && <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Reemplazante: {p.reemplazante}</div>}
                      {editable(p.estado) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button className="btn btn-outline" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => abrirEdicion(p)}>✏️ Editar</button>
                          <button className="btn btn-danger" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => cancelarPedido(p.id)}>✕ Cancelar pedido</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
