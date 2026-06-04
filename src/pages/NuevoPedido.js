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

export default function NuevoPedido() {
  const navigate = useNavigate();
  const [gerentes, setGerentes] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [form, setForm] = useState({
    empleado_nombre: '', empleado_email: '', empresa_id: '', gerente_id: '',
    fecha_inicio: '', fecha_fin: '', comentario_empleado: ''
  });
  const [dias, setDias] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/gerentes').then(r => setGerentes(r.data));
    api.get('/admin/feriados').then(r => setFeriados(r.data.map(f => f.fecha.split('T')[0]))).catch(() => {});
  }, []);

  useEffect(() => {
    setDias(calcDias(form.fecha_inicio, form.fecha_fin, feriados));
  }, [form.fecha_inicio, form.fecha_fin, feriados]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (dias <= 0) return setError('Las fechas seleccionadas no tienen días hábiles.');
    setLoading(true);
    try {
      const res = await api.post('/pedidos', { ...form, empresa_id: parseInt(form.empresa_id), gerente_id: parseInt(form.gerente_id), dias_habiles: dias });
      navigate('/pedido-exitoso', { state: { advertencia: res.data.advertencia_superposicion } });
    } catch (e) {
      setError(e.response?.data?.error || 'Error al enviar el pedido. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="navbar">
        <h1>🏖️ Sistema de Vacaciones</h1>
        <a href="/gerente/login" style={{ color: '#fff', fontSize: 13, opacity: .7 }}>Acceso gerentes</a>
      </div>
      <div className="container" style={{ maxWidth: 620, paddingTop: 32 }}>
        <div className="card">
          <h2>Pedido de vacaciones</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Completá el formulario y tu gerente recibirá una notificación para aprobarlo.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre y apellido *</label>
                <input value={form.empleado_nombre} onChange={e => set('empleado_nombre', e.target.value)} required placeholder="Ej: Juan Pérez" />
              </div>
              <div className="form-group">
                <label>Mail *</label>
                <input type="email" value={form.empleado_email} onChange={e => set('empleado_email', e.target.value)} required placeholder="tu@mail.com" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Empresa *</label>
                <select value={form.empresa_id} onChange={e => set('empresa_id', e.target.value)} required>
                  <option value="">Seleccioná una empresa</option>
                  {EMPRESAS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Gerente responsable *</label>
                <select value={form.gerente_id} onChange={e => set('gerente_id', e.target.value)} required>
                  <option value="">Seleccioná un gerente</option>
                  {gerentes.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha de inicio *</label>
                <input type="date" value={form.fecha_inicio} min={hoy} onChange={e => set('fecha_inicio', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Fecha de fin *</label>
                <input type="date" value={form.fecha_fin} min={form.fecha_inicio || hoy} onChange={e => set('fecha_fin', e.target.value)} required />
              </div>
            </div>

            {dias > 0 && (
              <div className="dias-calc">
                <div className="num">{dias}</div>
                <div className="label">días hábiles solicitados (sin domingos ni feriados)</div>
              </div>
            )}

            <div className="form-group">
              <label>Comentarios (opcional)</label>
              <textarea value={form.comentario_empleado} onChange={e => set('comentario_empleado', e.target.value)} placeholder="Podés agregar cualquier aclaración..." />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Enviando...' : 'Enviar pedido de vacaciones'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
