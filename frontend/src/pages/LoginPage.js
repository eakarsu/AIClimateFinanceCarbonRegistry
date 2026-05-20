import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('registry@carbon.io');
  const [password, setPassword] = useState('carbon2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span style={{ fontSize: 28 }}>🌱</span>
          <h1>CarbonLedger AI</h1>
          <p>Climate Finance Registry</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
            <div><strong>Demo users</strong> (password: <code>carbon2026</code>)</div>
            <div>admin: <code>registry@carbon.io</code></div>
            <div>registrar: <code>registrar@carbon.io</code></div>
            <div>auditor: <code>auditor@carbon.io</code></div>
          </div>
        </form>
      </div>
    </div>
  );
}
