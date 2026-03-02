import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken, setOnAuthFailure } from '../api';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const logout = useCallback(() => {
    clearAuthToken();
    setAuthed(false);
    setError('');
    setToken('');
  }, []);

  useEffect(() => {
    setOnAuthFailure(logout);
    const saved = getAuthToken();
    if (!saved) {
      setChecking(false);
      return;
    }
    api.verifyToken(saved).then((r) => {
      if (r.ok) {
        setAuthed(true);
      } else {
        clearAuthToken();
      }
      setChecking(false);
    }).catch(() => {
      clearAuthToken();
      setChecking(false);
    });
  }, [logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await api.verifyToken(trimmed);
      if (r.ok) {
        setAuthToken(trimmed);
        setAuthed(true);
      } else {
        setError('令牌无效，请重新输入');
      }
    } catch {
      setError('验证失败，请检查服务器是否运行');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-gate">
        <div className="auth-card">
          <div className="auth-logo">三省六部 · 总控台</div>
          <p style={{ color: 'var(--muted)', textAlign: 'center' }}>验证中…</p>
        </div>
      </div>
    );
  }

  if (authed) {
    return <>{children}</>;
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <div className="auth-logo">三省六部 · 总控台</div>
        <p className="auth-subtitle">请输入访问令牌以进入看板</p>
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="password"
            placeholder="输入 Auth Token…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            disabled={submitting}
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-btn" type="submit" disabled={submitting || !token.trim()}>
            {submitting ? '验证中…' : '进入看板'}
          </button>
        </form>
        <p className="auth-hint">令牌在服务器启动时显示于控制台</p>
      </div>
    </div>
  );
}
