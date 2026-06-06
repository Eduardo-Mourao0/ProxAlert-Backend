import { PaymentProvider } from '../entities/Subscription'

export const SUBSCRIPTION_NOTIFICATION_SERVICE = Symbol(
  'SUBSCRIPTION_NOTIFICATION_SERVICE',
)

export interface ParseSubscriptionNotificationRequest {
  provider: PaymentProvider
  body: unknown
}

export interface ParsedSubscriptionNotification {
  provider: PaymentProvider
  purchaseToken: string
}

export interface SubscriptionNotificationService {
  parseNotification(
    request: ParseSubscriptionNotificationRequest,
  ): ParsedSubscriptionNotification
}
