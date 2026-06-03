import { randomUUID } from 'crypto'
import { Plan } from './User'
import { InvalidSubscriptionExpirationError } from '../errors/invalid-subscription-expiration-error'
import { InvalidSubscriptionPlanError } from '../errors/invalid-subscription-plan-error'
import { InvalidSubscriptionProviderError } from '../errors/invalid-subscription-provider-error'
import { InvalidSubscriptionStatusError } from '../errors/invalid-subscription-status-error'
import { InvalidSubscriptionUserError } from '../errors/invalid-subscription-user-error'

export enum PaymentProvider {
  APPLE = 'APPLE',
  GOOGLE = 'GOOGLE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE',
}

export interface SubscriptionProps {
  id?: string
  userId: string
  provider: PaymentProvider
  providerSubscriptionId?: string | null
  providerTransactionId?: string | null
  status: SubscriptionStatus
  plan: Plan
  expiresAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class Subscription {
  public readonly id: string
  public readonly userId: string
  public provider: PaymentProvider
  public providerSubscriptionId: string | null
  public providerTransactionId: string | null
  public status: SubscriptionStatus
  public plan: Plan
  public expiresAt: Date | null
  public readonly createdAt: Date
  public updatedAt: Date

  private constructor(props: SubscriptionProps) {
    this.id = props.id ?? randomUUID()
    this.userId = props.userId
    this.provider = props.provider
    this.providerSubscriptionId = props.providerSubscriptionId ?? null
    this.providerTransactionId = props.providerTransactionId ?? null
    this.status = props.status
    this.plan = props.plan
    this.expiresAt = props.expiresAt ?? null
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()
  }

  static create(props: SubscriptionProps): Subscription {
    Subscription.validate(props)

    return new Subscription(props)
  }

  static createFromPrimitives(data: {
    id: string
    userId: string
    provider: PaymentProvider
    providerSubscriptionId?: string | null
    providerTransactionId?: string | null
    status: SubscriptionStatus
    plan: Plan
    expiresAt?: Date | null
    createdAt: Date
    updatedAt: Date
  }): Subscription {
    return new Subscription(data)
  }

  isActive(referenceDate = new Date()): boolean {
    if (this.status !== SubscriptionStatus.ACTIVE) {
      return false
    }

    if (!this.expiresAt) {
      return true
    }

    return this.expiresAt > referenceDate
  }

  cancel(): void {
    this.status = SubscriptionStatus.CANCELED
    this.touch()
  }

  expire(): void {
    this.status = SubscriptionStatus.EXPIRED
    this.touch()
  }

  markPastDue(): void {
    this.status = SubscriptionStatus.PAST_DUE
    this.touch()
  }

  renew(expiresAt: Date): void {
    this.status = SubscriptionStatus.ACTIVE
    this.expiresAt = expiresAt
    this.touch()
  }

  private touch(): void {
    this.updatedAt = new Date()
  }

  private static validate(props: SubscriptionProps): void {
    if (!props.userId || props.userId.trim().length === 0) {
      throw new InvalidSubscriptionUserError()
    }

    if (!Object.values(PaymentProvider).includes(props.provider)) {
      throw new InvalidSubscriptionProviderError(props.provider)
    }

    if (!Object.values(SubscriptionStatus).includes(props.status)) {
      throw new InvalidSubscriptionStatusError(props.status)
    }

    if (props.plan !== Plan.PREMIUM) {
      throw new InvalidSubscriptionPlanError()
    }

    if (props.expiresAt !== undefined && props.expiresAt !== null && !(props.expiresAt instanceof Date)) {
      throw new InvalidSubscriptionExpirationError()
    }

    if (props.expiresAt instanceof Date && Number.isNaN(props.expiresAt.getTime())) {
      throw new InvalidSubscriptionExpirationError()
    }
  }
}
