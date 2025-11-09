import { Controller, Get, Post, Request, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AuthUserSyncInterceptor } from '../../common/interceptors/auth-user-sync.interceptor';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(FirebaseAuthGuard)
@UseInterceptors(AuthUserSyncInterceptor)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post('create-checkout-session')
  async createCheckoutSession(@Request() req) {
    return this.subscriptionsService.createCheckoutSession(req.user.uid);
  }

  @Post('create-portal-session')
  async createPortalSession(@Request() req) {
    return this.subscriptionsService.createPortalSession(req.user.uid);
  }

  @Get('status')
  async getStatus(@Request() req) {
    return this.subscriptionsService.getSubscriptionStatus(req.user.uid);
  }

  // Webhook endpoint for Stripe (should not use FirebaseAuthGuard)
  @Post('webhook')
  async handleWebhook(@Request() req) {
    // In production, verify Stripe webhook signature
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // Handle different event types
    // switch (event.type) {
    //   case 'checkout.session.completed':
    //     const session = event.data.object;
    //     await this.subscriptionsService.activateSubscription(session.metadata.uid, session.subscription);
    //     break;
    //   case 'customer.subscription.deleted':
    //     const subscription = event.data.object;
    //     await this.subscriptionsService.cancelSubscription(subscription.metadata.uid);
    //     break;
    // }

    return { received: true };
  }
}

