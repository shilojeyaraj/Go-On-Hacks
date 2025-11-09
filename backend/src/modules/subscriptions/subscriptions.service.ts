import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create Stripe Checkout session for subscription
   */
  async createCheckoutSession(uid: string): Promise<{ url: string; sessionId: string }> {
    // For now, we'll simulate Stripe integration
    // In production, you would integrate with Stripe API here
    
    // Check if user already has active subscription
    const user = await this.userModel.findOne({ uid }).exec();
    if (user?.isPremium && user?.subscriptionStatus === 'active') {
      throw new Error('User already has an active subscription');
    }

    // In production, create Stripe Checkout Session:
    // const session = await stripe.checkout.sessions.create({
    //   customer_email: user?.email,
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency: 'usd',
    //       product_data: { name: 'ToeGether Premium' },
    //       recurring: { interval: 'month' },
    //       unit_amount: 500, // $5.00
    //     },
    //     quantity: 1,
    //   }],
    //   mode: 'subscription',
    //   success_url: `${process.env.FRONTEND_URL}/pricing?success=true`,
    //   cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
    //   metadata: { uid },
    // });

    // For now, return a mock session URL
    // In production, return: { url: session.url, sessionId: session.id }
    
    // Simulate successful subscription creation
    // In production, this would be handled by Stripe webhook
    const sessionId = `mock_session_${Date.now()}`;
    
    return {
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pricing?success=true&session_id=${sessionId}`,
      sessionId,
    };
  }

  /**
   * Create Stripe Customer Portal session
   */
  async createPortalSession(uid: string): Promise<{ url: string }> {
    const user = await this.userModel.findOne({ uid }).exec();
    
    if (!user?.subscriptionId) {
      throw new Error('No active subscription found');
    }

    // In production, create Stripe Portal Session:
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: user.stripeCustomerId,
    //   return_url: `${process.env.FRONTEND_URL}/pricing`,
    // });

    // For now, return mock URL
    return {
      url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pricing?portal=true`,
    };
  }

  /**
   * Get subscription status for user
   */
  async getSubscriptionStatus(uid: string): Promise<{ isPremium: boolean; subscriptionId?: string }> {
    const user = await this.userModel.findOne({ uid }).exec();
    
    if (!user) {
      return { isPremium: false };
    }

    // Check if premium is still valid
    if (user.isPremium && user.premiumExpiresAt) {
      const now = new Date();
      if (user.premiumExpiresAt < now) {
        // Premium expired, update user
        await this.userModel.updateOne(
          { uid },
          {
            $set: {
              isPremium: false,
              subscriptionStatus: 'expired',
            },
          },
        ).exec();
        return { isPremium: false };
      }
    }

    return {
      isPremium: user.isPremium || false,
      subscriptionId: user.subscriptionId,
    };
  }

  /**
   * Activate premium subscription (called by webhook or manual activation)
   */
  async activateSubscription(uid: string, subscriptionId: string): Promise<UserDocument> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        $set: {
          isPremium: true,
          subscriptionId,
          subscriptionStatus: 'active',
          premiumExpiresAt: expiresAt,
        },
      },
      { new: true },
    ).exec();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(uid: string): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        $set: {
          subscriptionStatus: 'canceled',
          // Keep premium active until expiration date
        },
      },
      { new: true },
    ).exec();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

