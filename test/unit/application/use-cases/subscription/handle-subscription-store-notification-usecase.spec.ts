import { HandleSubscriptionStoreNotificationUseCase } from '../../../../../src/application/use-cases/subscription/handle-subscription-store-notification-usecase'
import {
  PaymentProvider,
  Subscription,
  SubscriptionStatus,
} from '../../../../../src/domain/entities/Subscription'
import { Plan, User } from '../../../../../src/domain/entities/User'
import type { SubscriptionRepository } from '../../../../../src/domain/repositories/subscription-repository'
import type { UserRepository } from '../../../../../src/domain/repositories/user-repository'
import type {
  ParsedSubscriptionNotification,
  ParseSubscriptionNotificationRequest,
  SubscriptionNotificationService,
} from '../../../../../src/domain/services/subscription-notification-service'
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

  async updateRefreshToken(): Promise<void> {}

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

class FakeNotificationService implements SubscriptionNotificationService {
  parsedNotification: ParsedSubscriptionNotification = {
    provider: PaymentProvider.GOOGLE,
    purchaseToken: 'purchase-token',
  }
  lastRequest: ParseSubscriptionNotificationRequest | null = null

  parseNotification(
    request: ParseSubscriptionNotificationRequest,
  ): ParsedSubscriptionNotification {
    this.lastRequest = request
    return this.parsedNotification
  }
}

class FakePaymentService implements SubscriptionPaymentService {
  verifiedPurchase: VerifiedSubscriptionPurchase = {
    providerSubscriptionId: 'proxalert_premium',
    providerTransactionId: 'purchase-token',
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

function makeSubscription(status = SubscriptionStatus.PAST_DUE) {
  return Subscription.create({
    userId: 'user-id',
    provider: PaymentProvider.GOOGLE,
    providerSubscriptionId: 'proxalert_premium',
    providerTransactionId: 'purchase-token',
    status,
    plan: Plan.PREMIUM,
    expiresAt: new Date('2020-01-01T00:00:00.000Z'),
  })
}

describe('HandleSubscriptionStoreNotificationUseCase', () => {
  let userRepository: FakeUserRepository
  let subscriptionRepository: FakeSubscriptionRepository
  let notificationService: FakeNotificationService
  let paymentService: FakePaymentService
  let transactionManager: FakeTransactionManager
  let useCase: HandleSubscriptionStoreNotificationUseCase

  beforeEach(() => {
    userRepository = new FakeUserRepository()
    subscriptionRepository = new FakeSubscriptionRepository()
    notificationService = new FakeNotificationService()
    paymentService = new FakePaymentService()
    transactionManager = new FakeTransactionManager()
    useCase = new HandleSubscriptionStoreNotificationUseCase(
      userRepository,
      subscriptionRepository,
      paymentService,
      notificationService,
      transactionManager,
    )
  })

  it('revalidates the store notification and updates the subscription and user', async () => {
    userRepository.users.push(makeUser(Plan.FREE))
    subscriptionRepository.subscriptions.push(makeSubscription())

    const result = await useCase.execute({
      provider: PaymentProvider.GOOGLE,
      body: { webhook: true },
    })

    expect(notificationService.lastRequest).toEqual({
      provider: PaymentProvider.GOOGLE,
      body: { webhook: true },
    })
    expect(paymentService.lastRequest).toEqual({
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })
    expect(result.processed).toBe(true)
    expect(result.user?.plan).toBe(Plan.PREMIUM)
    expect(result.subscription?.status).toBe(SubscriptionStatus.ACTIVE)
    expect(transactionManager.runCalls).toBe(1)
  })

  it('returns not processed when the subscription does not exist locally', async () => {
    const result = await useCase.execute({
      provider: PaymentProvider.GOOGLE,
      body: { webhook: true },
    })

    expect(result).toEqual({
      processed: false,
      reason: 'Subscription not found.',
    })
  })
})
