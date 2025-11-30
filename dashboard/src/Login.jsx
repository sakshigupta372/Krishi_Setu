import { useState } from 'react';
import './Auth.css';
import ThemeToggle from './ThemeToggle';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-wave"></div>
        <div className="auth-wave"></div>
        <div className="auth-wave"></div>
        <div className="auth-wave"></div>
        <div className="auth-wave"></div>
        <div className="auth-particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <span className="logo-icon">🌾</span>
              <span className="logo-text">Krishi Setu</span>
            </div>
            <h1>Welcome Back</h1>
            <p>Smart Farming Made Simple</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="button-icon">→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <a href="/signup">Sign up now</a></p>
          </div>

          <div className="auth-features">
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Real-time Monitoring</span>
            </div>
            <div className="feature">
              <span className="feature-icon">💧</span>
              <span>Smart Irrigation</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🤖</span>
              <span>AI Recommendations</span>
            </div>
          </div>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}

export default Login;
