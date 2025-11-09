import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { Input } from '../../components/Input/Input';
import { Navigation } from '../../components/Navigation/Navigation';
import './Signup.css';

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
      // User sync is handled by useAuthUser hook and backend interceptor
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
      // User sync is handled by useAuthUser hook and backend interceptor
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
            <button 
              type="submit" 
              disabled={loading}
              className="auth-submit-btn"
            >
              Sign Up
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="auth-google-btn"
          >
            Sign up with Google
          </button>

          <p className="text-small text-center mt-large">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
    </div>
    </>
  );
};

