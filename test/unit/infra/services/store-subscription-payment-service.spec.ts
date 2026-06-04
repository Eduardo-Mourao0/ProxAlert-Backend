import { generateKeyPairSync } from 'crypto'
import { sign } from 'jsonwebtoken'
import {
  PaymentProvider,
  SubscriptionStatus,
} from '../../../../src/domain/entities/Subscription'
import { StoreSubscriptionPaymentService } from '../../../../src/infra/services/store-subscription-payment-service'

function makeResponse(ok: boolean, body: unknown) {
  return {
    ok,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response
}

function makeRsaPrivateKey(): string {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
  }).privateKey
}

function makeEcPrivateKey(): string {
  return generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
  }).privateKey
}

describe('StoreSubscriptionPaymentService', () => {
  const originalEnv = process.env
  let fetchMock: jest.Mock
  let service: StoreSubscriptionPaymentService

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_PLAY_PACKAGE_NAME: 'com.proxalert.app',
      GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL:
        'service-account@project.iam.gserviceaccount.com',
      GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY: makeRsaPrivateKey(),
      GOOGLE_PLAY_PREMIUM_PRODUCT_ID: 'proxalert_premium',
      APPLE_BUNDLE_ID: 'com.proxalert.app',
      APPLE_ISSUER_ID: 'issuer-id',
      APPLE_KEY_ID: 'key-id',
      APPLE_PRIVATE_KEY: makeEcPrivateKey(),
      APPLE_ENVIRONMENT: 'sandbox',
      APPLE_PREMIUM_PRODUCT_ID: 'proxalert_premium',
    }
    fetchMock = jest.fn()
    global.fetch = fetchMock
    service = new StoreSubscriptionPaymentService()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('verifies an active Google Play subscription', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(true, { access_token: 'access-token' }))
      .mockResolvedValueOnce(
        makeResponse(true, {
          latestOrderId: 'GPA.1234',
          subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
          lineItems: [
            {
              productId: 'proxalert_premium',
              expiryTime: '2030-01-01T00:00:00.000Z',
            },
          ],
        }),
      )

    const result = await service.verifyPurchase({
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })

    expect(result).toEqual({
      providerSubscriptionId: 'proxalert_premium',
      providerTransactionId: 'GPA.1234',
      status: SubscriptionStatus.ACTIVE,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects a Google Play subscription with a different product id', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(true, { access_token: 'access-token' }))
      .mockResolvedValueOnce(
        makeResponse(true, {
          latestOrderId: 'GPA.1234',
          subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
          lineItems: [
            {
              productId: 'other_product',
              expiryTime: '2030-01-01T00:00:00.000Z',
            },
          ],
        }),
      )

    await expect(
      service.verifyPurchase({
        provider: PaymentProvider.GOOGLE,
        purchaseToken: 'purchase-token',
      }),
    ).rejects.toMatchObject({
      message: 'Google Play subscription product is invalid.',
    })
  })

  it('keeps a canceled Google Play subscription active until expiry', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(true, { access_token: 'access-token' }))
      .mockResolvedValueOnce(
        makeResponse(true, {
          latestOrderId: 'GPA.1234',
          subscriptionState: 'SUBSCRIPTION_STATE_CANCELED',
          lineItems: [
            {
              productId: 'proxalert_premium',
              expiryTime: '2030-01-01T00:00:00.000Z',
            },
          ],
        }),
      )

    const result = await service.verifyPurchase({
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })

    expect(result.status).toBe(SubscriptionStatus.ACTIVE)
  })

  it('verifies an active Apple subscription', async () => {
    const signedTransactionInfo = sign(
      {
        productId: 'proxalert_premium',
        originalTransactionId: 'apple-original-transaction-id',
        transactionId: 'apple-transaction-id',
        expiresDate: new Date('2030-01-01T00:00:00.000Z').getTime(),
      },
      'test-secret',
    )
    fetchMock.mockResolvedValueOnce(
      makeResponse(true, {
        data: [
          {
            lastTransactions: [
              {
                status: 1,
                signedTransactionInfo,
              },
            ],
          },
        ],
      }),
    )

    const result = await service.verifyPurchase({
      provider: PaymentProvider.APPLE,
      purchaseToken: 'apple-transaction-id',
    })

    expect(result).toEqual({
      providerSubscriptionId: 'proxalert_premium',
      providerTransactionId: 'apple-original-transaction-id',
      status: SubscriptionStatus.ACTIVE,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects an Apple subscription with a different product id', async () => {
    const signedTransactionInfo = sign(
      {
        productId: 'other_product',
        originalTransactionId: 'apple-original-transaction-id',
        expiresDate: new Date('2030-01-01T00:00:00.000Z').getTime(),
      },
      'test-secret',
    )
    fetchMock.mockResolvedValueOnce(
      makeResponse(true, {
        data: [
          {
            lastTransactions: [
              {
                status: 1,
                signedTransactionInfo,
              },
            ],
          },
        ],
      }),
    )

    await expect(
      service.verifyPurchase({
        provider: PaymentProvider.APPLE,
        purchaseToken: 'apple-transaction-id',
      }),
    ).rejects.toMatchObject({
      message: 'Apple subscription product is invalid.',
    })
  })

  it('fails with a clear error when required config is missing', async () => {
    delete process.env.GOOGLE_PLAY_PACKAGE_NAME

    await expect(
      service.verifyPurchase({
        provider: PaymentProvider.GOOGLE,
        purchaseToken: 'purchase-token',
      }),
    ).rejects.toMatchObject({
      message: 'Missing environment variable: GOOGLE_PLAY_PACKAGE_NAME',
      statusCode: 500,
    })
  })
})
