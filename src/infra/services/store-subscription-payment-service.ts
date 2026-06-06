import { Injectable } from '@nestjs/common'
import { PaymentProvider } from '../../domain/entities/Subscription'
import { BusinessError } from '../../domain/errors/business-error'
import {
  SubscriptionPaymentService,
  VerifiedSubscriptionPurchase,
  VerifySubscriptionPurchaseRequest,
} from '../../domain/services/subscription-payment-service'
import { AppleStoreSubscriptionService } from './subscription/apple-store-subscription-service'
import { GooglePlaySubscriptionService } from './subscription/google-play-subscription-service'

@Injectable()
export class StoreSubscriptionPaymentService implements SubscriptionPaymentService {
  constructor(
    private readonly googlePlayService: GooglePlaySubscriptionService,
    private readonly appleStoreService: AppleStoreSubscriptionService,
  ) {}

  async verifyPurchase(request: VerifySubscriptionPurchaseRequest): Promise<VerifiedSubscriptionPurchase> {
    if (request.provider === PaymentProvider.GOOGLE) {
      return this.googlePlayService.verify(request.purchaseToken)
    }

    if (request.provider === PaymentProvider.APPLE) {
      return this.appleStoreService.verify(request.purchaseToken)
    }

    throw new BusinessError('Payment provider is not supported.', 400)
  }
}
