import { Injectable } from '@nestjs/common'
import {
  ConfirmSubscriptionPurchaseRequest,
  ConfirmSubscriptionPurchaseUseCase,
} from '../../../application/use-cases/subscription/confirm-subscription-purchase-usecase'
import {
  HandleSubscriptionStoreNotificationRequest,
  HandleSubscriptionStoreNotificationUseCase,
} from '../../../application/use-cases/subscription/handle-subscription-store-notification-usecase'

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly confirmSubscriptionPurchaseUseCase: ConfirmSubscriptionPurchaseUseCase,
    private readonly handleSubscriptionStoreNotificationUseCase: HandleSubscriptionStoreNotificationUseCase,
  ) {}

  confirmPurchase(data: ConfirmSubscriptionPurchaseRequest) {
    return this.confirmSubscriptionPurchaseUseCase.execute(data)
  }

  handleStoreNotification(data: HandleSubscriptionStoreNotificationRequest) {
    return this.handleSubscriptionStoreNotificationUseCase.execute(data)
  }
}
