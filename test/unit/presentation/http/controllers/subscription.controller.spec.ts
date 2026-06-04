import { ZodError } from 'zod'
import { PaymentProvider } from '../../../../../src/domain/entities/Subscription'
import { SubscriptionController } from '../../../../../src/presentation/http/controllers/subscription.controller'
import type { AuthenticatedRequest } from '../../../../../src/presentation/http/guards/jwt-auth.guard'

describe('SubscriptionController', () => {
  it('confirms a subscription using the authenticated user id', async () => {
    const service = {
      confirmPurchase: jest.fn().mockResolvedValue({ ok: true }),
    }
    const controller = new SubscriptionController(service as never)
    const request = {
      user: {
        id: 'authenticated-user-id',
      },
    } as AuthenticatedRequest

    const result = await controller.confirmPurchase(
      {
        provider: PaymentProvider.GOOGLE,
        purchaseToken: 'purchase-token',
      },
      request,
    )

    expect(result).toEqual({ ok: true })
    expect(service.confirmPurchase).toHaveBeenCalledWith({
      userId: 'authenticated-user-id',
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })
  })

  it('rejects userId in the body', () => {
    const service = {
      confirmPurchase: jest.fn(),
    }
    const controller = new SubscriptionController(service as never)
    const request = {
      user: {
        id: 'authenticated-user-id',
      },
    } as AuthenticatedRequest

    expect(() =>
      controller.confirmPurchase(
        {
          provider: PaymentProvider.GOOGLE,
          purchaseToken: 'purchase-token',
          userId: 'malicious-user-id',
        },
        request,
      ),
    ).toThrow(ZodError)
    expect(service.confirmPurchase).not.toHaveBeenCalled()
  })

  it('rejects invalid subscription payloads', () => {
    const service = {
      confirmPurchase: jest.fn(),
    }
    const controller = new SubscriptionController(service as never)
    const request = {
      user: {
        id: 'authenticated-user-id',
      },
    } as AuthenticatedRequest

    expect(() =>
      controller.confirmPurchase(
        {
          provider: 'STRIPE',
          purchaseToken: '',
        },
        request,
      ),
    ).toThrow(ZodError)
    expect(service.confirmPurchase).not.toHaveBeenCalled()
  })
})
