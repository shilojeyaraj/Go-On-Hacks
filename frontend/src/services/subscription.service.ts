import { api } from '../shared/api';

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface PortalSession {
  url: string;
}

export class SubscriptionService {
  /**
   * Create a Stripe Checkout session for subscription
   */
  static async createCheckoutSession(): Promise<CheckoutSession> {
    const response = await api.post('/subscriptions/create-checkout-session');
    return response.data;
  }

  /**
   * Create a Stripe Customer Portal session for managing subscription
   */
  static async createPortalSession(): Promise<PortalSession> {
    const response = await api.post('/subscriptions/create-portal-session');
    return response.data;
  }

  /**
   * Get subscription status
   */
  static async getSubscriptionStatus(): Promise<{ isPremium: boolean; subscriptionId?: string }> {
    const response = await api.get('/subscriptions/status');
    return response.data;
  }
}

