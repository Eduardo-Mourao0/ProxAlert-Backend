import {
  PaymentProvider,
  Subscription,
  SubscriptionStatus,
} from '../../../../src/domain/entities/Subscription'
import { Plan } from '../../../../src/domain/entities/User'
import { InvalidSubscriptionExpirationError } from '../../../../src/domain/errors/invalid-subscription-expiration-error'
import { InvalidSubscriptionPlanError } from '../../../../src/domain/errors/invalid-subscription-plan-error'
import { InvalidSubscriptionProviderError } from '../../../../src/domain/errors/invalid-subscription-provider-error'
import { InvalidSubscriptionStatusError } from '../../../../src/domain/errors/invalid-subscription-status-error'
import { InvalidSubscriptionUserError } from '../../../../src/domain/errors/invalid-subscription-user-error'

const validSubscriptionProps = {
  userId: 'user-id',
  provider: PaymentProvider.GOOGLE,
  providerSubscriptionId: 'subscription-id',
  providerTransactionId: 'transaction-id',
  status: SubscriptionStatus.ACTIVE,
  plan: Plan.PREMIUM,
  expiresAt: new Date('2030-01-01T00:00:00.000Z'),
}

describe('Subscription entity', () => {
  it('creates an active premium subscription', () => {
    const subscription = Subscription.create(validSubscriptionProps)

    expect(subscription.id).toEqual(expect.any(String))
    expect(subscription.userId).toBe('user-id')
    expect(subscription.provider).toBe(PaymentProvider.GOOGLE)
    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE)
    expect(subscription.plan).toBe(Plan.PREMIUM)
    expect(subscription.isActive(new Date('2029-01-01T00:00:00.000Z'))).toBe(true)
  })

  it('rejects empty user id', () => {
    expect(() =>
      Subscription.create({
        ...validSubscriptionProps,
        userId: '',
      }),
    ).toThrow(InvalidSubscriptionUserError)
  })

  it('rejects invalid provider', () => {
    expect(() =>
      Subscription.create({
        ...validSubscriptionProps,
        provider: 'STRIPE' as PaymentProvider,
      }),
    ).toThrow(InvalidSubscriptionProviderError)
  })

  it('rejects invalid status', () => {
    expect(() =>
      Subscription.create({
        ...validSubscriptionProps,
        status: 'PENDING' as SubscriptionStatus,
      }),
    ).toThrow(InvalidSubscriptionStatusError)
  })

  it('rejects non-premium plans', () => {
    expect(() =>
      Subscription.create({
        ...validSubscriptionProps,
        plan: Plan.FREE,
      }),
    ).toThrow(InvalidSubscriptionPlanError)
  })

  it('rejects invalid expiration dates', () => {
    expect(() =>
      Subscription.create({
        ...validSubscriptionProps,
        expiresAt: new Date('invalid-date'),
      }),
    ).toThrow(InvalidSubscriptionExpirationError)
  })

  it('marks subscription lifecycle statuses', () => {
    const subscription = Subscription.create(validSubscriptionProps)

    subscription.markPastDue()
    expect(subscription.status).toBe(SubscriptionStatus.PAST_DUE)
    expect(subscription.isActive()).toBe(false)

    subscription.renew(new Date('2031-01-01T00:00:00.000Z'))
    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE)
    expect(subscription.isActive(new Date('2030-01-01T00:00:00.000Z'))).toBe(true)

    subscription.cancel()
    expect(subscription.status).toBe(SubscriptionStatus.CANCELED)
    expect(subscription.isActive()).toBe(false)

    subscription.expire()
    expect(subscription.status).toBe(SubscriptionStatus.EXPIRED)
    expect(subscription.isActive()).toBe(false)
  })
})
