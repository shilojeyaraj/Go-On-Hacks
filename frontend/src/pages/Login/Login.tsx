import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { UserSyncService } from '../../services/user-sync.service';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Navigation } from '../../components/Navigation/Navigation';

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
      // Sync user to MongoDB after successful login
      await UserSyncService.syncUser();
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
      // Sync user to MongoDB after successful Google login
      await UserSyncService.syncUser();
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
            <Button type="submit" variant="secondary" disabled={loading} className="btn--full-width">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn--full-width"
          >
            Sign in with Google
          </Button>

          <p className="text-small text-center mt-large">
            Don't have an account? <Link to="/signup" className="link">Sign up</Link>
          </p>
        </div>
    </div>
    </>
  );
};

