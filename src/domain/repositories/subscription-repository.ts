import { PaymentProvider, Subscription } from '../entities/Subscription'

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY')

export interface SubscriptionRepository {
  
  create(subscription: Subscription): Promise<Subscription>
  
  update(subscription: Subscription): Promise<Subscription>
  
  findById(id: string): Promise<Subscription | null>
  
  findActiveByUserId(userId: string): Promise<Subscription | null>
  
  findByProviderTransaction(
    provider: PaymentProvider,
    providerTransactionId: string,
  ): Promise<Subscription | null>
}
