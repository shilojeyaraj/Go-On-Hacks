import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { Input } from '../../components/Input/Input';
import { Navigation } from '../../components/Navigation/Navigation';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    // Validation
    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }
    if (!password.trim()) {
      setValidationError('Password is required');
      return;
    }

    setLoading(true);

    try {
      await AuthService.signIn(email, password);
      // User sync is handled by useAuthUser hook and backend interceptor
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await AuthService.signInWithGoogle();
      // User sync is handled by useAuthUser hook and backend interceptor
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container">
        <div className="card card--narrow card--centered">
          <h1 className="text-title text-center mb-medium">Welcome Back</h1>
          <p className="text-subtitle text-center mb-large">Sign in to your account</p>

          {error && <div className="error-message">{error}</div>}
          {validationError && <div className="error-message">{validationError}</div>}

          <form onSubmit={handleEmailLogin} className="form">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <Link to="/forgot-password" className="link" style={{ fontSize: '0.875rem' }}>
                Forgot password?
              </Link>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="auth-submit-btn"
            >
              Sign In
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="auth-google-btn"
          >
            Sign in with Google
          </button>

          <p className="text-small text-center mt-large">
            Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
          </p>
        </div>
    </div>
    </>
  );
};

