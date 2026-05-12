import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { Btn, Input, Divider } from '../ui/index.jsx';

/* Subtle animated background */
function Background() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)',
          top: -150,
          right: -100,
          animation: 'pulse 9s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)',
          bottom: -80,
          left: -80,
          animation: 'pulse 12s ease-in-out infinite 3s',
        }}
      />
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <span
        style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.035em' }}
      >
        Nexus<span style={{ color: 'var(--accent)' }}>Chat</span>
      </span>
    </div>
  );
}

function EncryptBadge() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        background: 'var(--accent-dim)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 'var(--r-full)',
        marginBottom: 22,
      }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--accent)',
          letterSpacing: '0.04em',
        }}
      >
        RSA-2048 + AES-256 ENCRYPTED
      </span>
    </div>
  );
}

const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--r-2xl)',
  padding: '32px 28px',
  boxShadow:
    '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
      }}
    >
      <Background />
      <div
        className="animate-fade-up"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <div style={cardStyle}>
          <Logo />
          <EncryptBadge />
          <h1
            style={{
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 4,
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Sign in to continue your encrypted conversations
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              }
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
            <Btn
              type="submit"
              loading={loading}
              style={{
                marginTop: 4,
                height: 42,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Sign in
            </Btn>
          </form>

          <Divider label="or" style={{ margin: '20px 0' }} />
          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            No account?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Create one
            </Link>
          </p>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 14,
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          End-to-end encrypted · Your messages are always private
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password)
      return toast.error('Fill in all fields');
    if (form.password !== form.confirm)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
      }}
    >
      <Background />
      <div
        className="animate-fade-up"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <div style={cardStyle}>
          <Logo />
          <EncryptBadge />
          <h1
            style={{
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 4,
            }}
          >
            Create account
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Join NexusChat — encrypted by default
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 13 }}
          >
            <Input
              label="Username"
              value={form.username}
              onChange={set('username')}
              placeholder="cooluser123"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              }
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              }
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
            <Input
              label="Confirm Password"
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="••••••••"
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
            <Btn
              type="submit"
              loading={loading}
              style={{
                marginTop: 4,
                height: 42,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Create Account
            </Btn>
          </form>

          <Divider label="or" style={{ margin: '20px 0' }} />
          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
