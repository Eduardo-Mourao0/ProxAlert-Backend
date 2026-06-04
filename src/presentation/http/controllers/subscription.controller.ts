import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard'
import { SubscriptionService } from '../services/subscription.service'
import { confirmSubscriptionPurchaseBodySchema } from '../validators/subscription.validator'

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('confirm')
  @HttpCode(200)
  confirmPurchase(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = confirmSubscriptionPurchaseBodySchema.parse(body)

    return this.subscriptionService.confirmPurchase({
      userId: request.user.id,
      provider: data.provider,
      purchaseToken: data.purchaseToken,
    })
  }
}
