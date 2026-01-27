import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password);
      navigate('/pdf-tools');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">P</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Get started with your productivity journey</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message" style={{ textAlign: 'center', marginBottom: 8 }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              type="text"
              className="input"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
            />
          </div>

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
              minLength={6}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
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
                    setError(err.message || 'Google Signup Failed');
                  }
                }
              }}
              onError={() => {
                setError('Google Signup Failed');
              }}
              theme="filled_black"
              shape="pill"
              text="signup_with"
            />
          </div>
        </div>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
