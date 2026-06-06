import { Inject, Injectable } from '@nestjs/common'
import { PaymentProvider, Subscription } from '../../../domain/entities/Subscription'
import { Plan, User } from '../../../domain/entities/User'
import { BusinessError } from '../../../domain/errors/business-error'
import { SUBSCRIPTION_REPOSITORY, type SubscriptionRepository } from '../../../domain/repositories/subscription-repository'
import { USER_REPOSITORY, type UserRepository} from '../../../domain/repositories/user-repository'
import { SUBSCRIPTION_PAYMENT_SERVICE, type SubscriptionPaymentService, type VerifiedSubscriptionPurchase } from '../../../domain/services/subscription-payment-service'
import { TRANSACTION_MANAGER, type TransactionManager } from '../../../domain/services/transaction-manager'
import { ConfirmSubscriptionPurchaseDTO, toSubscriptionDTO } from '../../dtos/subscription-dto'
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

  async execute(request: ConfirmSubscriptionPurchaseRequest): Promise<ConfirmSubscriptionPurchaseDTO> {
    const user = await this.userRepository.findById(request.userId)

    if (!user) throw new BusinessError('User not found', 404)

    const verifiedPurchase = await this.subscriptionPaymentService.verifyPurchase({
      provider: request.provider,
      purchaseToken: request.purchaseToken,
    })

    return this.transactionManager.run(() =>
      this.confirmVerifiedPurchase(request, verifiedPurchase),
    )
  }

  private async confirmVerifiedPurchase(request: ConfirmSubscriptionPurchaseRequest, verifiedPurchase: VerifiedSubscriptionPurchase): Promise<ConfirmSubscriptionPurchaseDTO> {
    const user = await this.findUserOrThrow(request.userId)
    const savedSubscription = await this.createOrUpdateSubscription(
      user.id,
      request.provider,
      verifiedPurchase,
    )
    const updatedUser = await this.syncUserPlan(user, savedSubscription)

    return {
      user: toUserDTO(updatedUser),
      subscription: toSubscriptionDTO(savedSubscription),
    }
  }

  private async findUserOrThrow(userId: string) {
    const user = await this.userRepository.findById(userId)

    if (!user) throw new BusinessError('User not found', 404)

    return user
  }

  private async createOrUpdateSubscription(userId: string, provider: PaymentProvider, verifiedPurchase: VerifiedSubscriptionPurchase): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findByProviderTransaction(provider, verifiedPurchase.providerTransactionId)

    if (subscription) {
      subscription.updateFromVerifiedPurchase(verifiedPurchase)
      
      return this.subscriptionRepository.update(subscription)
    }

    return this.subscriptionRepository.create(
      Subscription.create({
        userId,
        provider,
        providerSubscriptionId: verifiedPurchase.providerSubscriptionId,
        providerTransactionId: verifiedPurchase.providerTransactionId,
        status: verifiedPurchase.status,
        plan: Plan.PREMIUM,
        expiresAt: verifiedPurchase.expiresAt,
      }),
    )
  }

  private async syncUserPlan(user: User, subscription: Subscription): Promise<User> {
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