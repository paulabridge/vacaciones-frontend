import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('gerente', JSON.stringify(data.gerente));
      navigate('/gerente/panel');
    } catch (e) {
      setError(e.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>🏖️ Vacaciones</h2>
        <p>Acceso para gerentes y administración</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="tu@mail.com" />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 12, color: '#888', textAlign: 'center' }}>
          ¿Querés pedir tus vacaciones? <a href="/" style={{ color: '#1E3A5F' }}>Hacé click acá</a>
        </p>
      </div>
    </div>
  );
}
