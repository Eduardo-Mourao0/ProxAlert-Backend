import { Inject, Injectable } from '@nestjs/common'
import {
  PaymentProvider,
  Subscription,
} from '../../../domain/entities/Subscription'
import { Plan, User } from '../../../domain/entities/User'
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
  SUBSCRIPTION_PAYMENT_SERVICE,
  type SubscriptionPaymentService,
  type VerifiedSubscriptionPurchase,
} from '../../../domain/services/subscription-payment-service'
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '../../../domain/services/transaction-manager'
import {
  ConfirmSubscriptionPurchaseDTO,
  toSubscriptionDTO,
} from '../../dtos/subscription-dto'
import { toUserDTO } from '../../dtos/create-user.dto'

export interface ConfirmSubscriptionPurchaseRequest {
  userId: string
  provider: PaymentProvider
  purchaseToken: string
}

@Injectable()
export class ConfirmSubscriptionPurchaseUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(SUBSCRIPTION_PAYMENT_SERVICE)
    private readonly subscriptionPaymentService: SubscriptionPaymentService,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(
    request: ConfirmSubscriptionPurchaseRequest,
  ): Promise<ConfirmSubscriptionPurchaseDTO> {
    const user = await this.userRepository.findById(request.userId)

    if (!user) throw new BusinessError('User not found', 404)

    const verifiedPurchase = await this.subscriptionPaymentService.verifyPurchase({
      provider: request.provider,
      purchaseToken: request.purchaseToken,
    })

    return this.transactionManager.run(() =>
      this.confirmVerifiedPurchase(user, request, verifiedPurchase),
    )
  }

  private async confirmVerifiedPurchase(
    user: User,
    request: ConfirmSubscriptionPurchaseRequest,
    verifiedPurchase: VerifiedSubscriptionPurchase,
  ): Promise<ConfirmSubscriptionPurchaseDTO> {
    const existingSubscription =
      await this.subscriptionRepository.findByProviderTransaction(
        request.provider,
        verifiedPurchase.providerTransactionId,
      )

    if (existingSubscription) {
      existingSubscription.updateFromVerifiedPurchase(verifiedPurchase)
    }

    const subscription = existingSubscription ?? Subscription.create({
      userId: user.id,
      provider: request.provider,
      providerSubscriptionId: verifiedPurchase.providerSubscriptionId,
      providerTransactionId: verifiedPurchase.providerTransactionId,
      status: verifiedPurchase.status,
      plan: Plan.PREMIUM,
      expiresAt: verifiedPurchase.expiresAt,
    })

    const savedSubscription = existingSubscription
      ? await this.subscriptionRepository.update(subscription)
      : await this.subscriptionRepository.create(subscription)

    let updatedUser = user

    if (savedSubscription.isActive() && !user.isPremium()) {
      user.upgradeToPremium()
      updatedUser = await this.userRepository.update(user)
    } else if (!savedSubscription.isActive() && user.isPremium()) {
      user.downgradeToFree()
      updatedUser = await this.userRepository.update(user)
    }

    return {
      user: toUserDTO(updatedUser),
      subscription: toSubscriptionDTO(savedSubscription),
    } 
  }
}