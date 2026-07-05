import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/ZIIILiving3.png';
import '@/styles/login.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authBrand">
          <img className="authLogo" src={logo} alt="ZIII Living" />
          <div className="authTagline">
            Administración, cobranza y accesos en una sola plataforma.
          </div>
          <div className="authHint">
            Accede con tu cuenta administrativa.
          </div>
        </div>

        <div className="authFormWrap">
          <div className="authTitle">Iniciar sesión</div>
          <div className="authSubtitle">Portal administrativo</div>

          <form onSubmit={handleSubmit} className="authForm">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Correo</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tucondominio.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary authSubmit" disabled={loading}>
              {loading ? 'Iniciando…' : 'Ingresar'}
            </button>
          </form>

          <div className="authFooter">
            <div className="authDemo">
              Demo: <strong>admin@example.com</strong> / <strong>password</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
