import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { PaymentProvider } from '../../../domain/entities/Subscription'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard'
import { SubscriptionService } from '../services/subscription.service'
import { confirmSubscriptionPurchaseBodySchema } from '../validators/subscription.validator'

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  confirmPurchase(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = confirmSubscriptionPurchaseBodySchema.parse(body)

    return this.subscriptionService.confirmPurchase({
      userId: request.user.id,
      provider: data.provider,
      purchaseToken: data.purchaseToken,
    })
  }

  @Post('google/notifications')
  @HttpCode(200)
  handleGoogleNotification(@Body() body: unknown) {
    return this.subscriptionService.handleStoreNotification({
      provider: PaymentProvider.GOOGLE,
      body,
    })
  }

  @Post('apple/notifications')
  @HttpCode(200)
  handleAppleNotification(@Body() body: unknown) {
    return this.subscriptionService.handleStoreNotification({
      provider: PaymentProvider.APPLE,
      body,
    })
  }
}
