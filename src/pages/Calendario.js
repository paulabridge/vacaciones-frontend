import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import Navbar from '../components/Navbar';
import api from '../api';

const EMPRESAS = [
  { id: '', nombre: 'Todas las empresas' },
  { id: 1, nombre: 'Volkswagen', color: '#2563EB' },
  { id: 2, nombre: 'Turenne', color: '#EA580C' },
  { id: 3, nombre: 'Chevrolet', color: '#CA8A04' },
  { id: 4, nombre: 'Chery', color: '#DC2626' },
  { id: 5, nombre: 'Audi', color: '#1C1C1C' },
  { id: 6, nombre: 'Multimarca', color: '#7C3AED' },
];

export default function Calendario() {
  const [eventos, setEventos] = useState([]);
  const [gerentes, setGerentes] = useState([]);
  const [filtroGerente, setFiltroGerente] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => { api.get('/gerentes').then(r => setGerentes(r.data)); }, []);

  useEffect(() => { cargarEventos(); }, [filtroGerente, filtroEmpresa]);

  async function cargarEventos() {
    const params = {};
    if (filtroGerente) params.gerente_id = filtroGerente;
    if (filtroEmpresa) params.empresa_id = filtroEmpresa;
    const { data } = await api.get('/calendario', { params });

    const evs = data.map(p => ({
      id: p.id,
      title: p.empleado_nombre,
      start: p.fecha_inicio.split('T')[0],
      end: (() => {
        const d = new Date(p.fecha_fin);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })(),
      backgroundColor: p.empresa_color,
      borderColor: p.empresa_color,
      extendedProps: { ...p }
    }));
    setEventos(evs);
  }

  function handleEventClick(info) {
    const p = info.event.extendedProps;
    setTooltip({
      nombre: info.event.title,
      empresa: p.empresa_nombre,
      color: p.empresa_color,
      desde: new Date(p.fecha_inicio).toLocaleDateString('es-AR'),
      hasta: new Date(p.fecha_fin).toLocaleDateString('es-AR'),
      dias: p.dias_habiles,
      gerente: p.gerente_nombre,
      reemplazante: p.reemplazante,
    });
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 28 }}>
        <h2 className="page-title">Calendario de vacaciones</h2>

        <div className="legend">
          {EMPRESAS.filter(e => e.id).map(e => (
            <div key={e.id} className="legend-item">
              <span style={{ width: 12, height: 12, borderRadius: 3, background: e.color, display: 'inline-block' }}></span>
              {e.nombre}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d0d7e3', fontSize: 14 }}>
            {EMPRESAS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select value={filtroGerente} onChange={e => setFiltroGerente(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d0d7e3', fontSize: 14 }}>
            <option value="">Todos los gerentes</option>
            {gerentes.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>

        {tooltip && (
          <div className="card" style={{ border: `2px solid ${tooltip.color}`, marginBottom: 20, position: 'relative' }}>
            <button onClick={() => setTooltip(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: tooltip.color, display: 'inline-block', flexShrink: 0 }}></span>
              <strong style={{ fontSize: 16 }}>{tooltip.nombre}</strong>
              <span style={{ color: '#666', fontSize: 14 }}>{tooltip.empresa}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
              <div><span style={{ color: '#666' }}>Desde:</span> {tooltip.desde}</div>
              <div><span style={{ color: '#666' }}>Hasta:</span> {tooltip.hasta}</div>
              <div><span style={{ color: '#666' }}>Días hábiles:</span> <strong>{tooltip.dias}</strong></div>
              <div><span style={{ color: '#666' }}>Gerente:</span> {tooltip.gerente}</div>
              {tooltip.reemplazante && <div><span style={{ color: '#666' }}>Reemplazante:</span> {tooltip.reemplazante}</div>}
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 16 }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            events={eventos}
            eventClick={handleEventClick}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={4}
          />
        </div>
      </div>
    </div>
  );
}
