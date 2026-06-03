import {
  PaymentProvider,
  SubscriptionStatus,
} from '../entities/Subscription'

export const SUBSCRIPTION_PAYMENT_SERVICE = Symbol(
  'SUBSCRIPTION_PAYMENT_SERVICE',
)

export interface VerifySubscriptionPurchaseRequest {
  provider: PaymentProvider
  purchaseToken: string
}

export interface VerifiedSubscriptionPurchase {
  providerSubscriptionId?: string | null
  providerTransactionId: string
  status: SubscriptionStatus
  expiresAt?: Date | null
}

export interface SubscriptionPaymentService {
  verifyPurchase(
    request: VerifySubscriptionPurchaseRequest,
  ): Promise<VerifiedSubscriptionPurchase>
}
