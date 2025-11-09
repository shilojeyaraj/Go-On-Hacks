import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Navigation } from '../../components/Navigation/Navigation';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');
    setSuccess(false);

    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await AuthService.sendPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container">
        <div className="card card--narrow card--centered">
          <h1 className="text-title text-center mb-medium">Reset Password</h1>
          <p className="text-subtitle text-center mb-large">
            Enter your email address and we'll send you a link to reset your password
          </p>

          {error && <div className="error-message">{error}</div>}
          {validationError && <div className="error-message">{validationError}</div>}
          {success && (
            <div style={{
              backgroundColor: 'var(--color-rose)',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
            }}>
              Password reset email sent! Check your inbox.
            </div>
          )}

          {!success ? (
            <form onSubmit={handlePasswordReset} className="form">
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" disabled={loading} className="btn--full-width">
                Send Reset Link
              </Button>
              {loading && <p className="text-small text-center mt-small" style={{ color: 'var(--text-dark)' }}>Sending...</p>}
            </form>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/login')}
              className="btn--full-width"
            >
              Back to Login
            </Button>
          )}

          <p className="text-small text-center mt-large">
            Remember your password? <Link to="/login" className="link">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
};



