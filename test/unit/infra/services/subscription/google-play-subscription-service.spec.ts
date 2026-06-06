import { generateKeyPairSync } from 'crypto'
import { PaymentProvider, SubscriptionStatus } from '../../../../../src/domain/entities/Subscription'
import { GooglePlaySubscriptionService } from '../../../../../src/infra/services/subscription/google-play-subscription-service'

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

describe('GooglePlaySubscriptionService', () => {
  const originalEnv = process.env
  let fetchMock: jest.Mock
  let service: GooglePlaySubscriptionService

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_PLAY_PACKAGE_NAME: 'com.proxalert.app',
      GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL:
        'service-account@project.iam.gserviceaccount.com',
      GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY: makeRsaPrivateKey(),
      GOOGLE_PLAY_PREMIUM_PRODUCT_ID: 'proxalert_premium',
    }
    fetchMock = jest.fn()
    global.fetch = fetchMock
    service = new GooglePlaySubscriptionService()
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

    const result = await service.verify('purchase-token')

    expect(result).toEqual({
      providerSubscriptionId: 'proxalert_premium',
      providerTransactionId: 'purchase-token',
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

    await expect(service.verify('purchase-token')).rejects.toMatchObject({
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

    const result = await service.verify('purchase-token')

    expect(result.status).toBe(SubscriptionStatus.ACTIVE)
  })

  it('fails with a clear error when required config is missing', async () => {
    delete process.env.GOOGLE_PLAY_PACKAGE_NAME

    await expect(service.verify('purchase-token')).rejects.toMatchObject({
      message: 'Missing environment variable: GOOGLE_PLAY_PACKAGE_NAME',
      statusCode: 500,
    })
  })
})
