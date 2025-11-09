import React, { useState, useEffect } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { useAuthUser } from '../../hooks/useAuthUser';
import { UserService } from '../../services/user.service';
import { SubscriptionService } from '../../services/subscription.service';
import { Button } from '../../components/Button/Button';
import './Pricing.css';

export const Pricing: React.FC = () => {
  const { user } = useAuthUser();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkPremiumStatus();
  }, [user]);

  const checkPremiumStatus = async () => {
    if (!user?.uid) return;
    try {
      const userData = await UserService.getCurrentUser();
      setIsPremium(userData.isPremium || false);
    } catch (err: any) {
      console.error('Failed to check premium status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.uid) {
      setError('Please log in to subscribe');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      setSuccess('');

      // Create checkout session
      const session = await SubscriptionService.createCheckoutSession();
      
      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to start subscription. Please try again.');
      setProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.uid) return;

    try {
      setProcessing(true);
      setError('');
      
      const session = await SubscriptionService.createPortalSession();
      
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (err: any) {
      console.error('Portal error:', err);
      setError(err.message || 'Failed to open subscription management. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-body">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="pricing-container">
        <div className="pricing-header">
          <h1 className="text-title text-center">Choose Your Plan</h1>
          <p className="text-body text-center">Unlock unlimited swipes and find your perfect match</p>
        </div>

        <div className="pricing-plans">
          {/* Free Plan */}
          <div className={`pricing-plan ${isPremium ? 'pricing-plan--disabled' : ''}`}>
            <div className="pricing-plan-header">
              <h2 className="pricing-plan-name">Free</h2>
              <div className="pricing-plan-price">
                <span className="pricing-plan-amount">$0</span>
                <span className="pricing-plan-period">/month</span>
              </div>
            </div>
            <ul className="pricing-plan-features">
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span>50 swipes per day</span>
              </li>
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span>Basic matching</span>
              </li>
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span>Chat with matches</span>
              </li>
              <li className="pricing-plan-feature pricing-plan-feature--disabled">
                <span className="pricing-plan-feature-icon">✗</span>
                <span>Unlimited swipes</span>
              </li>
            </ul>
            {isPremium ? (
              <Button variant="secondary" disabled className="pricing-plan-button">
                Current Plan
              </Button>
            ) : (
              <Button variant="secondary" disabled className="pricing-plan-button">
                Current Plan
              </Button>
            )}
          </div>

          {/* Premium Plan */}
          <div className={`pricing-plan pricing-plan--premium ${isPremium ? 'pricing-plan--active' : ''}`}>
            {isPremium && (
              <div className="pricing-plan-badge">Current Plan</div>
            )}
            <div className="pricing-plan-header">
              <h2 className="pricing-plan-name">Premium</h2>
              <div className="pricing-plan-price">
                <span className="pricing-plan-amount">$5</span>
                <span className="pricing-plan-period">/month</span>
              </div>
            </div>
            <ul className="pricing-plan-features">
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span><strong>Unlimited swipes</strong></span>
              </li>
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span>Priority matching</span>
              </li>
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span>Chat with matches</span>
              </li>
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span>See who liked you</span>
              </li>
              <li className="pricing-plan-feature">
                <span className="pricing-plan-feature-icon">✓</span>
                <span>Advanced filters</span>
              </li>
            </ul>
            {isPremium ? (
              <Button
                variant="secondary"
                onClick={handleManageSubscription}
                disabled={processing}
                className="pricing-plan-button"
              >
                {processing ? 'Loading...' : 'Manage Subscription'}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubscribe}
                disabled={processing}
                className="pricing-plan-button"
              >
                {processing ? 'Processing...' : 'Subscribe Now'}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="pricing-error">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="pricing-success">
            <p>{success}</p>
          </div>
        )}

        <div className="pricing-footer">
          <p className="text-small text-center">
            All subscriptions are billed monthly and can be cancelled at any time.
          </p>
        </div>
      </div>
    </>
  );
};

