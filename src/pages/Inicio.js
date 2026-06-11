import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

function calcDias(inicio, fin) {
  if (!inicio || !fin) return 0;
  const diff = Math.round((new Date(fin) - new Date(inicio)) / (1000*60*60*24)) + 1;
  return diff > 0 ? diff : 0;
}

function fmt(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Inicio() {
  const navigate = useNavigate();
  const location = useLocation();
  const tabInicial = location.state?.tab || 'nuevo';
  const [tab, setTab] = useState(tabInicial);

  // Formulario nuevo pedido
  const [gerentes, setGerentes] = useState([]);
  const [form, setForm] = useState({ empleado_nombre: '', empleado_email: '', empresa_id: '', gerente_id: '', fecha_inicio: '', fecha_fin: '', comentario_empleado: '' });
  const [dias, setDias] = useState(0);
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [exito, setExito] = useState(false);
  const [advertencia, setAdvertencia] = useState('');

  // Mis pedidos
  const [email, setEmail] = useState('');
  const [emailBuscado, setEmailBuscado] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [msgPedidos, setMsgPedidos] = useState('');
  const [errorPedidos, setErrorPedidos] = useState('');
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [diasEdit, setDiasEdit] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/gerentes').then(r => setGerentes(r.data));
    }, []);

  useEffect(() => { setDias(calcDias(form.fecha_inicio, form.fecha_fin)); }, [form.fecha_inicio, form.fecha_fin, feriados]);
  useEffect(() => { if (formEdit.fecha_inicio && formEdit.fecha_fin) setDiasEdit(calcDias(formEdit.fecha_inicio, formEdit.fecha_fin)); }, [formEdit.fecha_inicio, formEdit.fecha_fin, feriados]);

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submitNuevo(e) {
    e.preventDefault();
    setErrorForm('');
    if (dias <= 0) return setErrorForm('Las fechas seleccionadas no tienen días hábiles.');
    setLoadingForm(true);
    try {
      const res = await api.post('/pedidos', { ...form, empresa_id: parseInt(form.empresa_id), gerente_id: parseInt(form.gerente_id), dias_habiles: dias });
      setExito(true);
      setAdvertencia(res.data.advertencia_superposicion || '');
      setForm({ empleado_nombre: '', empleado_email: '', empresa_id: '', gerente_id: '', fecha_inicio: '', fecha_fin: '', comentario_empleado: '' });
    } catch (e) {
      setErrorForm(e.response?.data?.error || 'Error al enviar el pedido.');
    }
    setLoadingForm(false);
  }

  async function buscarPedidos(e) {
    e.preventDefault();
    setLoadingPedidos(true);
    setMsgPedidos(''); setErrorPedidos('');
    try {
      const { data } = await api.post('/pedidos/mis-pedidos', { email });
      setPedidos(data);
      setEmailBuscado(email);
      if (data.length === 0) setMsgPedidos('No encontramos pedidos para ese mail.');
    } catch { setErrorPedidos('Error al buscar pedidos.'); }
    setLoadingPedidos(false);
  }

  function abrirEdicion(p) {
    setEditando(p.id);
    setFormEdit({ fecha_inicio: p.fecha_inicio.split('T')[0], fecha_fin: p.fecha_fin.split('T')[0], comentario_empleado: p.comentario_empleado || '', empresa_id: p.empresa_id, gerente_id: p.gerente_id });
    setDiasEdit(p.dias_habiles);
    setMsgPedidos(''); setErrorPedidos('');
  }

  async function guardarEdicion(id) {
    if (diasEdit <= 0) return setErrorPedidos('Las fechas no tienen días hábiles válidos.');
    setGuardando(true);
    try {
      await api.put(`/pedidos/${id}`, { empleado_email: emailBuscado, ...formEdit, empresa_id: parseInt(formEdit.empresa_id), gerente_id: parseInt(formEdit.gerente_id) });
      setMsgPedidos('Pedido actualizado. El gerente fue notificado.');
      setEditando(null);
      const { data } = await api.post('/pedidos/mis-pedidos', { email: emailBuscado });
      setPedidos(data);
    } catch (e) { setErrorPedidos(e.response?.data?.error || 'Error al guardar.'); }
    setGuardando(false);
  }

  async function cancelarPedido(id) {
    if (!window.confirm('¿Seguro que querés cancelar este pedido?')) return;
    try {
      await api.delete(`/pedidos/${id}`, { data: { empleado_email: emailBuscado } });
      setMsgPedidos('Pedido cancelado.');
      const { data } = await api.post('/pedidos/mis-pedidos', { email: emailBuscado });
      setPedidos(data);
    } catch (e) { setErrorPedidos(e.response?.data?.error || 'Error al cancelar.'); }
  }

  const editable = (estado) => ['pendiente', 'a_revisar'].includes(estado);
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="navbar">
        <h1>🏖️ Sistema de Vacaciones</h1>
        <a href="/gerente/login" style={{ color: '#fff', fontSize: 13, opacity: .7 }}>Acceso gerentes</a>
      </div>
      <div className="container" style={{ maxWidth: 660, paddingTop: 32 }}>
        <div className="card">
          <div className="tabs">
            <button className={`tab-btn ${tab === 'nuevo' ? 'active' : ''}`} onClick={() => { setTab('nuevo'); setExito(false); }}>✈️ Nuevo pedido</button>
            <button className={`tab-btn ${tab === 'mis' ? 'active' : ''}`} onClick={() => setTab('mis')}>📋 Mis pedidos</button>
          </div>

          {/* ── TAB NUEVO PEDIDO ── */}
          {tab === 'nuevo' && (
            exito ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
                <h2 style={{ color: '#1E3A5F', marginBottom: 8 }}>¡Pedido enviado!</h2>
                <p style={{ color: '#555', marginBottom: 20 }}>Tu gerente recibirá una notificación y te avisaremos por mail cuando responda.</p>
                {advertencia && <div className="alert alert-warning" style={{ marginBottom: 16 }}>⚠️ {advertencia}</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => setExito(false)}>Hacer otro pedido</button>
                  <button className="btn btn-outline" onClick={() => setTab('mis')}>Ver mis pedidos</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Completá el formulario y tu gerente recibirá una notificación para aprobarlo.</p>
                {errorForm && <div className="alert alert-error">{errorForm}</div>}
                <form onSubmit={submitNuevo}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre y apellido *</label>
                      <input value={form.empleado_nombre} onChange={e => setF('empleado_nombre', e.target.value)} required placeholder="Juan Pérez" />
                    </div>
                    <div className="form-group">
                      <label>Mail *</label>
                      <input type="email" value={form.empleado_email} onChange={e => setF('empleado_email', e.target.value)} required placeholder="tu@mail.com" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Empresa *</label>
                      <select value={form.empresa_id} onChange={e => setF('empresa_id', e.target.value)} required>
                        <option value="">Seleccioná una empresa</option>
                        {EMPRESAS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gerente responsable *</label>
                      <select value={form.gerente_id} onChange={e => setF('gerente_id', e.target.value)} required>
                        <option value="">Seleccioná un gerente</option>
                        {gerentes.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha de inicio *</label>
                      <input type="date" value={form.fecha_inicio} min={hoy} onChange={e => setF('fecha_inicio', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Fecha de fin *</label>
                      <input type="date" value={form.fecha_fin} min={form.fecha_inicio || hoy} onChange={e => setF('fecha_fin', e.target.value)} required />
                    </div>
                  </div>
                  {dias > 0 && (
                    <div className="dias-calc">
                      <div className="num">{dias}</div>
                      <div className="label">días hábiles solicitados</div>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Comentarios (opcional)</label>
                    <textarea value={form.comentario_empleado} onChange={e => setF('comentario_empleado', e.target.value)} placeholder="Podés agregar cualquier aclaración..." />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loadingForm} style={{ width: '100%', marginTop: 8 }}>
                    {loadingForm ? 'Enviando...' : 'Enviar pedido de vacaciones'}
                  </button>
                </form>
              </>
            )
          )}

          {/* ── TAB MIS PEDIDOS ── */}
          {tab === 'mis' && (
            <div>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>Ingresá tu mail para ver y gestionar tus pedidos.</p>
              <form onSubmit={buscarPedidos} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@mail.com" style={{ flex: 1, padding: '10px 12px', border: '1px solid #d0d7e3', borderRadius: 6, fontSize: 14 }} />
                <button type="submit" className="btn btn-primary" disabled={loadingPedidos}>{loadingPedidos ? 'Buscando...' : 'Buscar'}</button>
              </form>

              {msgPedidos && <div className="alert alert-success">{msgPedidos}</div>}
              {errorPedidos && <div className="alert alert-error">{errorPedidos}</div>}

              {pedidos.map(p => (
                <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  {editando === p.id ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <strong style={{ color: '#1E3A5F' }}>Editando pedido</strong>
                        <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>✕</button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Empresa *</label>
                          <select value={formEdit.empresa_id} onChange={e => setFormEdit(f => ({ ...f, empresa_id: e.target.value }))} required>
                            {EMPRESAS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Gerente *</label>
                          <select value={formEdit.gerente_id} onChange={e => setFormEdit(f => ({ ...f, gerente_id: e.target.value }))} required>
                            {gerentes.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Fecha de inicio *</label>
                          <input type="date" value={formEdit.fecha_inicio} min={hoy} onChange={e => setFormEdit(f => ({ ...f, fecha_inicio: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label>Fecha de fin *</label>
                          <input type="date" value={formEdit.fecha_fin} min={formEdit.fecha_inicio || hoy} onChange={e => setFormEdit(f => ({ ...f, fecha_fin: e.target.value }))} required />
                        </div>
                      </div>
                      {diasEdit > 0 && <div className="dias-calc"><div className="num">{diasEdit}</div><div className="label">días hábiles</div></div>}
                      <div className="form-group">
                        <label>Comentarios (opcional)</label>
                        <textarea value={formEdit.comentario_empleado} onChange={e => setFormEdit(f => ({ ...f, comentario_empleado: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-primary" onClick={() => guardarEdicion(p.id)} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
                        <button className="btn btn-outline" onClick={() => setEditando(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span className="empresa-dot" style={{ background: EMPRESA_COLORES[p.empresa_nombre] || '#888' }}></span>
                          <strong>{p.empresa_nombre}</strong>
                          <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>→ {p.gerente_nombre}</span>
                        </div>
                        <span className={`badge badge-${p.estado}`}>{p.estado === 'a_revisar' ? 'a revisar' : p.estado}</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#444', marginBottom: 6 }}>
                        {fmt(p.fecha_inicio)} → {fmt(p.fecha_fin)} · <strong>{p.dias_habiles} días hábiles</strong>
                      </div>
                      {p.comentario_empleado && <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Tu comentario: {p.comentario_empleado}</div>}
                      {p.comentario_gerente && (
                        <div style={{ background: '#fef9ee', border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 8 }}>
                          💬 <strong>Comentario del gerente:</strong> {p.comentario_gerente}
                        </div>
                      )}
                      {p.reemplazante && <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Reemplazante: {p.reemplazante}</div>}
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
