import { Subscription } from '../../domain/entities/Subscription'
import { UserDTO } from './create-user.dto'

export interface SubscriptionDTO {
  id: string
  userId: string
  provider: string
  providerSubscriptionId: string | null
  providerTransactionId: string | null
  status: string
  plan: string
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ConfirmSubscriptionPurchaseDTO {
  user: UserDTO
  subscription: SubscriptionDTO
}

export interface SubscriptionNotificationDTO {
  processed: boolean
  user?: UserDTO
  subscription?: SubscriptionDTO
  reason?: string
}

export function toSubscriptionDTO(
  subscription: Subscription,
): SubscriptionDTO {
  return {
    id: subscription.id,
    userId: subscription.userId,
    provider: subscription.provider,
    providerSubscriptionId: subscription.providerSubscriptionId,
    providerTransactionId: subscription.providerTransactionId,
    status: subscription.status,
    plan: subscription.plan,
    expiresAt: subscription.expiresAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  }
}
