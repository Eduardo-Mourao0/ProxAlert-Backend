import { Injectable } from '@nestjs/common'
import {
  ConfirmSubscriptionPurchaseRequest,
  ConfirmSubscriptionPurchaseUseCase,
} from '../../../application/use-cases/subscription/confirm-subscription-purchase-usecase'

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly confirmSubscriptionPurchaseUseCase: ConfirmSubscriptionPurchaseUseCase,
  ) {}

  confirmPurchase(data: ConfirmSubscriptionPurchaseRequest) {
    return this.confirmSubscriptionPurchaseUseCase.execute(data)
  }
}
