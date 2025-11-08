import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Navigation } from '../../components/Navigation/Navigation';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e: React.FormEvent) => {
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
      await AuthService.signUp(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await AuthService.signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container">
        <div className="card card--narrow card--centered">
          <h1 className="text-title text-center mb-medium">Create Account</h1>
          <p className="text-subtitle text-center mb-large">Sign up to get started</p>

          {error && <div className="error-message">{error}</div>}
          {validationError && <div className="error-message">{validationError}</div>}

          <form onSubmit={handleEmailSignup} className="form">
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" disabled={loading} className="btn--full-width">
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="btn--full-width"
          >
            Sign up with Google
          </Button>

          <p className="text-small text-center mt-large">
            Already have an account? <Link to="/login" className="link">Sign in</Link>
          </p>
        </div>
    </div>
    </>
  );
};

