import { Injectable } from '@nestjs/common'
import {
  PaymentProvider,
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/Subscription'
import { Plan } from '../../domain/entities/User'
import { SubscriptionRepository } from '../../domain/repositories/subscription-repository'
import { PrismaService } from '../database/prisma/prisma.service'

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(subscription: Subscription): Promise<Subscription> {
    const createdSubscription = await this.prisma.subscription.create({
      data: {
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
      },
    })

    return this.toDomain(createdSubscription)
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        provider: subscription.provider,
        providerSubscriptionId: subscription.providerSubscriptionId,
        providerTransactionId: subscription.providerTransactionId,
        status: subscription.status,
        plan: subscription.plan,
        expiresAt: subscription.expiresAt,
        updatedAt: subscription.updatedAt,
      },
    })

    return this.toDomain(updatedSubscription)
  }

  async findById(id: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    })

    if (!subscription) return null

    return this.toDomain(subscription)
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) return null

    return this.toDomain(subscription)
  }

  async findByProviderTransaction(
    provider: PaymentProvider,
    providerTransactionId: string,
  ): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        provider,
        providerTransactionId,
      },
    })

    if (!subscription) return null

    return this.toDomain(subscription)
  }

  private toDomain(subscription: {
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
  }): Subscription {
    return Subscription.createFromPrimitives({
      id: subscription.id,
      userId: subscription.userId,
      provider: subscription.provider as PaymentProvider,
      providerSubscriptionId: subscription.providerSubscriptionId,
      providerTransactionId: subscription.providerTransactionId,
      status: subscription.status as SubscriptionStatus,
      plan: subscription.plan as Plan,
      expiresAt: subscription.expiresAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    })
  }
}
