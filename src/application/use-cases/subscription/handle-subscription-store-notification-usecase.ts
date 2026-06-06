import { Inject, Injectable } from '@nestjs/common'
import { PaymentProvider, Subscription } from '../../../domain/entities/Subscription'
import { User } from '../../../domain/entities/User'
import { BusinessError } from '../../../domain/errors/business-error'
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from '../../../domain/repositories/subscription-repository'
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/repositories/user-repository'
import {
  SUBSCRIPTION_NOTIFICATION_SERVICE,
  type SubscriptionNotificationService,
} from '../../../domain/services/subscription-notification-service'
import {
  SUBSCRIPTION_PAYMENT_SERVICE,
  type SubscriptionPaymentService,
  type VerifiedSubscriptionPurchase,
} from '../../../domain/services/subscription-payment-service'
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '../../../domain/services/transaction-manager'
import {
  SubscriptionNotificationDTO,
  toSubscriptionDTO,
} from '../../dtos/subscription-dto'
import { toUserDTO } from '../../dtos/create-user.dto'

export interface HandleSubscriptionStoreNotificationRequest {
  provider: PaymentProvider
  body: unknown
}

@Injectable()
export class HandleSubscriptionStoreNotificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(SUBSCRIPTION_PAYMENT_SERVICE)
    private readonly subscriptionPaymentService: SubscriptionPaymentService,
    @Inject(SUBSCRIPTION_NOTIFICATION_SERVICE)
    private readonly subscriptionNotificationService: SubscriptionNotificationService,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(
    request: HandleSubscriptionStoreNotificationRequest,
  ): Promise<SubscriptionNotificationDTO> {
    const notification = this.subscriptionNotificationService.parseNotification(
      request,
    )
    const verifiedPurchase = await this.subscriptionPaymentService.verifyPurchase(
      notification,
    )

    return this.transactionManager.run(() =>
      this.applyVerifiedPurchase(notification.provider, verifiedPurchase),
    )
  }

  private async applyVerifiedPurchase(
    provider: PaymentProvider,
    verifiedPurchase: VerifiedSubscriptionPurchase,
  ): Promise<SubscriptionNotificationDTO> {
    const subscription =
      await this.subscriptionRepository.findByProviderTransaction(
        provider,
        verifiedPurchase.providerTransactionId,
      )

    if (!subscription) {
      return {
        processed: false,
        reason: 'Subscription not found.',
      }
    }

    subscription.updateFromVerifiedPurchase(verifiedPurchase)

    const savedSubscription = await this.subscriptionRepository.update(
      subscription,
    )
    const user = await this.findUserOrThrow(savedSubscription.userId)
    const updatedUser = await this.syncUserPlan(user, savedSubscription)

    return {
      processed: true,
      user: toUserDTO(updatedUser),
      subscription: toSubscriptionDTO(savedSubscription),
    }
  }

  private async findUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId)

    if (!user) throw new BusinessError('User not found', 404)

    return user
  }

  private async syncUserPlan(
    user: User,
    subscription: Subscription,
  ): Promise<User> {
    if (subscription.isActive() && !user.isPremium()) {
      user.upgradeToPremium()
      return this.userRepository.update(user)
    }

    if (!subscription.isActive() && user.isPremium()) {
      user.downgradeToFree()
      return this.userRepository.update(user)
    }

    return user
  }
}
