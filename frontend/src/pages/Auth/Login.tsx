import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/pdf-tools');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">P</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to access your productivity tools</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message" style={{ textAlign: 'center', marginBottom: 8 }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px', position: 'relative' }}>
            <span style={{ background: 'var(--bg-primary)', padding: '0 10px', position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-secondary)' }}>
              OR
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    await googleLogin(credentialResponse.credential);
                    navigate('/pdf-tools');
                  } catch (err: any) {
                    setError(err.message || 'Google Login Failed');
                  }
                }
              }}
              onError={() => {
                setError('Google Login Failed');
              }}
              theme="filled_black"
              shape="pill"
            />
          </div>
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
