import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { Btn, Input, Divider } from '../ui/index.jsx';

/* Animated background mesh */
function BgMesh() {
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
      {/* Grid dots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Glow orbs */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,212,180,0.07) 0%, transparent 65%)',
          top: -200,
          right: -150,
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)',
          bottom: -100,
          left: -100,
          animation: 'pulse 10s ease-in-out infinite 2s',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 65%)',
          top: '40%',
          left: '30%',
        }}
      />
      {/* Subtle horizontal lines */}
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <div
          key={t}
          style={{
            position: 'absolute',
            top: `${t * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)`,
          }}
        />
      ))}
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
          width: 38,
          height: 38,
          borderRadius: 12,
          background:
            'linear-gradient(135deg,var(--accent),var(--accent-dark))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-accent)',
          flexShrink: 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#020c0a"
          strokeWidth="2.5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>
        Nexus<span style={{ color: 'var(--accent)' }}>Chat</span>
      </span>
    </div>
  );
}

function EncryptBadge() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: 'var(--accent-dim)',
        border: '1px solid var(--accent-glow)',
        borderRadius: 'var(--r-full)',
        marginBottom: 24,
        width: 'fit-content',
      }}
    >
      <svg
        width="12"
        height="12"
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
          fontSize: 11,
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
      <BgMesh />
      <div
        className="animate-fade-up"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--r-2xl)',
            padding: '36px 32px',
            boxShadow:
              'var(--shadow-glass), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <Logo />
          <EncryptBadge />
          <h1
            style={{
              fontSize: 22,
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
              marginBottom: 26,
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
                  width="15"
                  height="15"
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
                  width="15"
                  height="15"
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
                marginTop: 6,
                height: 44,
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              Sign in
            </Btn>
          </form>

          <Divider label="or" style={{ margin: '22px 0' }} />
          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            No account yet?{' '}
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
            marginTop: 16,
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <svg
            width="10"
            height="10"
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
      <BgMesh />
      <div
        className="animate-fade-up"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--r-2xl)',
            padding: '36px 32px',
            boxShadow:
              'var(--shadow-glass), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <Logo />
          <EncryptBadge />
          <h1
            style={{
              fontSize: 22,
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
              marginBottom: 26,
              lineHeight: 1.6,
            }}
          >
            Join SecureChat — encrypted by default
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <Input
              label="Username"
              value={form.username}
              onChange={set('username')}
              placeholder="cooluser123"
              icon={
                <svg
                  width="15"
                  height="15"
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
                  width="15"
                  height="15"
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
                  width="15"
                  height="15"
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
                  width="15"
                  height="15"
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
                marginTop: 6,
                height: 44,
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              Create Account
            </Btn>
          </form>

          <Divider label="or" style={{ margin: '22px 0' }} />
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
