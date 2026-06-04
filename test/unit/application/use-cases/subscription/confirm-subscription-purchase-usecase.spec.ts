import { ConfirmSubscriptionPurchaseUseCase } from '../../../../../src/application/use-cases/subscription/confirm-subscription-purchase-usecase'
import {
  PaymentProvider,
  Subscription,
  SubscriptionStatus,
} from '../../../../../src/domain/entities/Subscription'
import { Plan, User } from '../../../../../src/domain/entities/User'
import type { SubscriptionRepository } from '../../../../../src/domain/repositories/subscription-repository'
import type { UserRepository } from '../../../../../src/domain/repositories/user-repository'
import type {
  SubscriptionPaymentService,
  VerifiedSubscriptionPurchase,
  VerifySubscriptionPurchaseRequest,
} from '../../../../../src/domain/services/subscription-payment-service'
import type { TransactionManager } from '../../../../../src/domain/services/transaction-manager'

class FakeUserRepository implements UserRepository {
  users: User[] = []
  updateCalls = 0

  async create(user: User): Promise<User> {
    this.users.push(user)
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null
  }

  async update(user: User): Promise<User> {
    this.updateCalls += 1
    this.users = this.users.map((currentUser) =>
      currentUser.id === user.id ? user : currentUser,
    )
    return user
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    const user = await this.findById(userId)
    if (user) user.refreshTokenHash = refreshTokenHash
  }

  async findAll(): Promise<User[]> {
    return this.users
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id)
  }
}

class FakeSubscriptionRepository implements SubscriptionRepository {
  subscriptions: Subscription[] = []

  async create(subscription: Subscription): Promise<Subscription> {
    this.subscriptions.push(subscription)
    return subscription
  }

  async update(subscription: Subscription): Promise<Subscription> {
    this.subscriptions = this.subscriptions.map((currentSubscription) =>
      currentSubscription.id === subscription.id
        ? subscription
        : currentSubscription,
    )
    return subscription
  }

  async findById(id: string): Promise<Subscription | null> {
    return (
      this.subscriptions.find((subscription) => subscription.id === id) ?? null
    )
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    return (
      this.subscriptions.find(
        (subscription) =>
          subscription.userId === userId && subscription.isActive(),
      ) ?? null
    )
  }

  async findByProviderTransaction(
    provider: PaymentProvider,
    providerTransactionId: string,
  ): Promise<Subscription | null> {
    return (
      this.subscriptions.find(
        (subscription) =>
          subscription.provider === provider &&
          subscription.providerTransactionId === providerTransactionId,
      ) ?? null
    )
  }
}

class FakeSubscriptionPaymentService implements SubscriptionPaymentService {
  verifiedPurchase: VerifiedSubscriptionPurchase = {
    providerSubscriptionId: 'provider-subscription-id',
    providerTransactionId: 'provider-transaction-id',
    status: SubscriptionStatus.ACTIVE,
    expiresAt: new Date('2030-01-01T00:00:00.000Z'),
  }
  lastRequest: VerifySubscriptionPurchaseRequest | null = null

  async verifyPurchase(
    request: VerifySubscriptionPurchaseRequest,
  ): Promise<VerifiedSubscriptionPurchase> {
    this.lastRequest = request
    return this.verifiedPurchase
  }
}

class FakeTransactionManager implements TransactionManager {
  runCalls = 0

  async run<T>(callback: () => Promise<T>): Promise<T> {
    this.runCalls += 1
    return callback()
  }
}

function makeUser(plan = Plan.FREE) {
  return User.createFromPrimitives({
    id: 'user-id',
    name: 'Eduardo',
    email: 'eduardo@email.com',
    password: 'hashed:1234',
    plan,
    createdAt: new Date(),
  })
}

describe('ConfirmSubscriptionPurchaseUseCase', () => {
  let userRepository: FakeUserRepository
  let subscriptionRepository: FakeSubscriptionRepository
  let paymentService: FakeSubscriptionPaymentService
  let transactionManager: FakeTransactionManager
  let useCase: ConfirmSubscriptionPurchaseUseCase

  beforeEach(() => {
    userRepository = new FakeUserRepository()
    subscriptionRepository = new FakeSubscriptionRepository()
    paymentService = new FakeSubscriptionPaymentService()
    transactionManager = new FakeTransactionManager()
    useCase = new ConfirmSubscriptionPurchaseUseCase(
      userRepository,
      subscriptionRepository,
      paymentService,
      transactionManager,
    )
  })

  it('confirms an active purchase, creates a subscription and upgrades the user', async () => {
    userRepository.users.push(makeUser(Plan.FREE))

    const result = await useCase.execute({
      userId: 'user-id',
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })

    expect(paymentService.lastRequest).toEqual({
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })
    expect(result.user.plan).toBe(Plan.PREMIUM)
    expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE)
    expect(subscriptionRepository.subscriptions).toHaveLength(1)
    expect(userRepository.users[0].plan).toBe(Plan.PREMIUM)
    expect(transactionManager.runCalls).toBe(1)
  })

  it('confirms an inactive purchase and keeps the user free', async () => {
    userRepository.users.push(makeUser(Plan.PREMIUM))
    paymentService.verifiedPurchase = {
      providerSubscriptionId: 'provider-subscription-id',
      providerTransactionId: 'provider-transaction-id',
      status: SubscriptionStatus.EXPIRED,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    }

    const result = await useCase.execute({
      userId: 'user-id',
      provider: PaymentProvider.APPLE,
      purchaseToken: 'purchase-token',
    })

    expect(result.user.plan).toBe(Plan.FREE)
    expect(result.subscription.status).toBe(SubscriptionStatus.EXPIRED)
    expect(userRepository.users[0].plan).toBe(Plan.FREE)
  })

  it('does not update the user when the plan is already premium', async () => {
    userRepository.users.push(makeUser(Plan.PREMIUM))

    const result = await useCase.execute({
      userId: 'user-id',
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })

    expect(result.user.plan).toBe(Plan.PREMIUM)
    expect(userRepository.updateCalls).toBe(0)
  })

  it('does not update the user when the plan is already free', async () => {
    userRepository.users.push(makeUser(Plan.FREE))
    paymentService.verifiedPurchase = {
      providerSubscriptionId: 'provider-subscription-id',
      providerTransactionId: 'provider-transaction-id',
      status: SubscriptionStatus.EXPIRED,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    }

    const result = await useCase.execute({
      userId: 'user-id',
      provider: PaymentProvider.APPLE,
      purchaseToken: 'purchase-token',
    })

    expect(result.user.plan).toBe(Plan.FREE)
    expect(userRepository.updateCalls).toBe(0)
  })

  it('updates an existing subscription from the same provider transaction', async () => {
    userRepository.users.push(makeUser(Plan.FREE))
    subscriptionRepository.subscriptions.push(
      Subscription.create({
        userId: 'user-id',
        provider: PaymentProvider.GOOGLE,
        providerSubscriptionId: 'old-subscription-id',
        providerTransactionId: 'provider-transaction-id',
        status: SubscriptionStatus.PAST_DUE,
        plan: Plan.PREMIUM,
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    )

    await useCase.execute({
      userId: 'user-id',
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })

    expect(subscriptionRepository.subscriptions).toHaveLength(1)
    expect(subscriptionRepository.subscriptions[0].status).toBe(
      SubscriptionStatus.ACTIVE,
    )
    expect(subscriptionRepository.subscriptions[0].providerSubscriptionId).toBe(
      'provider-subscription-id',
    )
  })

  it('rejects unknown users', async () => {
    await expect(
      useCase.execute({
        userId: 'unknown-user',
        provider: PaymentProvider.GOOGLE,
        purchaseToken: 'purchase-token',
      }),
    ).rejects.toMatchObject({
      message: 'User not found',
      statusCode: 404,
    })
  })
})
