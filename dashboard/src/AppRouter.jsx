import { useState, useEffect } from 'react';
import App from './App';
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

function AppRouter() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'signup', 'dashboard'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setCurrentPage('dashboard');
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleSignup = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('login');
  };

  // Handle navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/signup') {
        setCurrentPage('signup');
      } else if (path === '/login') {
        setCurrentPage('login');
      } else if (user) {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Update URL when page changes
  useEffect(() => {
    if (currentPage === 'login') {
      window.history.pushState({}, '', '/login');
    } else if (currentPage === 'signup') {
      window.history.pushState({}, '', '/signup');
    } else if (currentPage === 'dashboard') {
      window.history.pushState({}, '', '/');
    }
  }, [currentPage]);

  // Handle link clicks
  useEffect(() => {
    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.href) {
        const url = new URL(target.href);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          if (url.pathname === '/login') {
            setCurrentPage('login');
          } else if (url.pathname === '/signup') {
            setCurrentPage('signup');
          } else if (url.pathname === '/' && user) {
            setCurrentPage('dashboard');
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [user]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌾</div>
          <div>Loading Krishi Setu...</div>
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === 'signup') {
    return <Signup onSignup={handleSignup} />;
  }

  if (currentPage === 'dashboard' && user) {
    return <App user={user} onLogout={handleLogout} />;
  }

  // Default: show login
  return <Login onLogin={handleLogin} />;
}

export default AppRouter;
