import {
  PaymentProvider,
  SubscriptionStatus,
} from '../../../../src/domain/entities/Subscription'
import type { VerifiedSubscriptionPurchase } from '../../../../src/domain/services/subscription-payment-service'
import { AppleStoreSubscriptionService } from '../../../../src/infra/services/subscription/apple-store-subscription-service'
import { GooglePlaySubscriptionService } from '../../../../src/infra/services/subscription/google-play-subscription-service'
import { StoreSubscriptionPaymentService } from '../../../../src/infra/services/store-subscription-payment-service'

describe('StoreSubscriptionPaymentService', () => {
  const verifiedPurchase: VerifiedSubscriptionPurchase = {
    providerSubscriptionId: 'proxalert_premium',
    providerTransactionId: 'transaction-id',
    status: SubscriptionStatus.ACTIVE,
    expiresAt: new Date('2030-01-01T00:00:00.000Z'),
  }

  it('delegates Google purchases to GooglePlaySubscriptionService', async () => {
    const googlePlayService = {
      verify: jest.fn().mockResolvedValue(verifiedPurchase),
    } as unknown as GooglePlaySubscriptionService
    const appleStoreService = {
      verify: jest.fn(),
    } as unknown as AppleStoreSubscriptionService
    const service = new StoreSubscriptionPaymentService(
      googlePlayService,
      appleStoreService,
    )

    const result = await service.verifyPurchase({
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })

    expect(result).toBe(verifiedPurchase)
    expect(googlePlayService.verify).toHaveBeenCalledWith('purchase-token')
    expect(appleStoreService.verify).not.toHaveBeenCalled()
  })

  it('delegates Apple purchases to AppleStoreSubscriptionService', async () => {
    const googlePlayService = {
      verify: jest.fn(),
    } as unknown as GooglePlaySubscriptionService
    const appleStoreService = {
      verify: jest.fn().mockResolvedValue(verifiedPurchase),
    } as unknown as AppleStoreSubscriptionService
    const service = new StoreSubscriptionPaymentService(
      googlePlayService,
      appleStoreService,
    )

    const result = await service.verifyPurchase({
      provider: PaymentProvider.APPLE,
      purchaseToken: 'apple-transaction-id',
    })

    expect(result).toBe(verifiedPurchase)
    expect(appleStoreService.verify).toHaveBeenCalledWith(
      'apple-transaction-id',
    )
    expect(googlePlayService.verify).not.toHaveBeenCalled()
  })
})
