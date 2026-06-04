import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

function fmt(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const EMPRESA_COLORES = { 'Volkswagen': '#2563EB', 'Turenne': '#EA580C', 'Chevrolet': '#CA8A04', 'Chery': '#DC2626', 'Audi': '#1C1C1C', 'Multimarca': '#7C3AED' };

export default function PanelAdmin() {
  const [tab, setTab] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [gerentes, setGerentes] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [filtros, setFiltros] = useState({ estado: '', gerente_id: '', empresa_id: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Feriados form
  const [nfFecha, setNfFecha] = useState('');
  const [nfDesc, setNfDesc] = useState('');

  // Reset password
  const [resetId, setResetId] = useState('');
  const [resetPass, setResetPass] = useState('');

  useEffect(() => {
    api.get('/gerentes').then(r => setGerentes(r.data));
    cargarFeriados();
  }, []);

  useEffect(() => { if (tab === 'pedidos') cargarPedidos(); }, [tab, filtros]);

  async function cargarPedidos() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/pedidos', { params: filtros });
      setPedidos(data);
    } catch {}
    setLoading(false);
  }

  async function cargarFeriados() {
    const { data } = await api.get('/admin/feriados');
    setFeriados(data);
  }

  async function agregarFeriado(e) {
    e.preventDefault();
    await api.post('/admin/feriados', { fecha: nfFecha, descripcion: nfDesc });
    setNfFecha(''); setNfDesc('');
    cargarFeriados();
    setMsg('Feriado agregado.');
  }

  async function eliminarFeriado(id) {
    await api.delete(`/admin/feriados/${id}`);
    cargarFeriados();
  }

  async function resetPassword(e) {
    e.preventDefault();
    await api.post(`/admin/gerentes/${resetId}/reset-password`, { password: resetPass });
    setResetId(''); setResetPass('');
    setMsg('Contraseña actualizada.');
  }

  function exportarCSV() {
    const headers = ['Empleado','Email','Empresa','Gerente','Desde','Hasta','Días','Estado','Reemplazante','Comentario gerente'];
    const rows = pedidos.map(p => [
      p.empleado_nombre, p.empleado_email, p.empresa_nombre, p.gerente_nombre,
      fmt(p.fecha_inicio), fmt(p.fecha_fin), p.dias_habiles, p.estado,
      p.reemplazante || '', p.comentario_gerente || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vacaciones.csv'; a.click();
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 28 }}>
        <h2 className="page-title">Panel de administración</h2>
        {msg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{msg}</div>}

        <div className="tabs">
          {[['pedidos','Todos los pedidos'],['feriados','Feriados'],['gerentes','Gerentes']].map(([v,l]) => (
            <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {tab === 'pedidos' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={filtros.estado} onChange={e => setFiltros(f=>({...f,estado:e.target.value}))} style={{ padding:'8px 12px',borderRadius:6,border:'1px solid #d0d7e3',fontSize:14 }}>
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="a_revisar">A revisar</option>
              </select>
              <select value={filtros.gerente_id} onChange={e => setFiltros(f=>({...f,gerente_id:e.target.value}))} style={{ padding:'8px 12px',borderRadius:6,border:'1px solid #d0d7e3',fontSize:14 }}>
                <option value="">Todos los gerentes</option>
                {gerentes.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
              <button className="btn btn-outline" onClick={exportarCSV} style={{ marginLeft: 'auto' }}>⬇ Exportar CSV</button>
            </div>
            <div className="card">
              {loading ? <p>Cargando...</p> : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Empleado</th><th>Empresa</th><th>Gerente</th><th>Desde</th><th>Hasta</th><th>Días</th><th>Estado</th><th>Reemplazante</th></tr></thead>
                    <tbody>
                      {pedidos.map(p => (
                        <tr key={p.id}>
                          <td>{p.empleado_nombre}<br/><span style={{fontSize:12,color:'#888'}}>{p.empleado_email}</span></td>
                          <td><span className="empresa-dot" style={{background:EMPRESA_COLORES[p.empresa_nombre]||'#888'}}></span>{p.empresa_nombre}</td>
                          <td>{p.gerente_nombre}</td>
                          <td>{fmt(p.fecha_inicio)}</td>
                          <td>{fmt(p.fecha_fin)}</td>
                          <td><strong>{p.dias_habiles}</strong></td>
                          <td><span className={`badge badge-${p.estado}`}>{p.estado === 'a_revisar' ? 'a revisar' : p.estado}</span></td>
                          <td>{p.reemplazante || <span style={{color:'#ccc'}}>—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pedidos.length === 0 && <p style={{textAlign:'center',color:'#888',padding:20}}>No hay pedidos.</p>}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'feriados' && (
          <div className="card">
            <h2>Gestión de feriados</h2>
            <form onSubmit={agregarFeriado} style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
              <input type="date" value={nfFecha} onChange={e=>setNfFecha(e.target.value)} required style={{ padding:'8px 12px',borderRadius:6,border:'1px solid #d0d7e3',fontSize:14 }} />
              <input value={nfDesc} onChange={e=>setNfDesc(e.target.value)} placeholder="Descripción" required style={{ flex:1,padding:'8px 12px',borderRadius:6,border:'1px solid #d0d7e3',fontSize:14 }} />
              <button type="submit" className="btn btn-primary">Agregar</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Descripción</th><th></th></tr></thead>
                <tbody>
                  {feriados.map(f => (
                    <tr key={f.id}>
                      <td>{fmt(f.fecha)}</td>
                      <td>{f.descripcion}</td>
                      <td><button className="btn btn-danger" style={{padding:'4px 10px',fontSize:12}} onClick={()=>eliminarFeriado(f.id)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'gerentes' && (
          <div className="card">
            <h2>Cambiar contraseña de gerente</h2>
            <form onSubmit={resetPassword} style={{ maxWidth: 400 }}>
              <div className="form-group">
                <label>Gerente</label>
                <select value={resetId} onChange={e=>setResetId(e.target.value)} required>
                  <option value="">Seleccioná un gerente</option>
                  {gerentes.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input type="password" value={resetPass} onChange={e=>setResetPass(e.target.value)} required placeholder="Nueva contraseña" />
              </div>
              <button type="submit" className="btn btn-primary">Actualizar contraseña</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
