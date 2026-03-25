import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { useAuthStore } from './store/authStore';
import { LoginPage, RegisterPage } from './components/auth/AuthPages';
import ChatPage from './pages/ChatPage';
import { useEffect } from 'react';
import { Spinner } from './components/ui/index.jsx';

function ProtectedRoute({ children }) {
  const { user, token, loading, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token && !user) fetchMe();
  }, [token]);

  if (loading && token) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, color: '#0a0d12', boxShadow: 'var(--shadow-accent)' }}>N</div>
        <Spinner size={28} />
      </div>
    );
  }

  if (!user && !token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, token } = useAuthStore();
  if (user || token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/*" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" autoClose={3000} hideProgressBar={false} />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
