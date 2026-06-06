import { generateKeyPairSync } from 'crypto'
import { sign } from 'jsonwebtoken'
import { SubscriptionStatus } from '../../../../../src/domain/entities/Subscription'
import { AppleStoreSubscriptionService } from '../../../../../src/infra/services/subscription/apple-store-subscription-service'

function makeResponse(ok: boolean, body: unknown) {
  return {
    ok,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response
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

describe('AppleStoreSubscriptionService', () => {
  const originalEnv = process.env
  let fetchMock: jest.Mock
  let service: AppleStoreSubscriptionService

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      APPLE_BUNDLE_ID: 'com.proxalert.app',
      APPLE_ISSUER_ID: 'issuer-id',
      APPLE_KEY_ID: 'key-id',
      APPLE_PRIVATE_KEY: makeEcPrivateKey(),
      APPLE_ENVIRONMENT: 'sandbox',
      APPLE_PREMIUM_PRODUCT_ID: 'proxalert_premium',
    }
    fetchMock = jest.fn()
    global.fetch = fetchMock
    service = new AppleStoreSubscriptionService()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
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

    const result = await service.verify('apple-transaction-id')

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

    await expect(service.verify('apple-transaction-id')).rejects.toMatchObject({
      message: 'Apple subscription product is invalid.',
    })
  })
})
