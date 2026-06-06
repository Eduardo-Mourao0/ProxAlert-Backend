import { PaymentProvider } from '../../../../../src/domain/entities/Subscription'
import { GooglePlayNotificationParser } from '../../../../../src/infra/services/subscription/google-play-notification-parser'

describe('GooglePlayNotificationParser', () => {
  it('parses a Google Pub/Sub subscription notification', () => {
    const parser = new GooglePlayNotificationParser()
    const data = Buffer.from(
      JSON.stringify({
        subscriptionNotification: {
          purchaseToken: 'purchase-token',
        },
      }),
    ).toString('base64')

    expect(
      parser.parse({
        message: {
          data,
        },
      }),
    ).toEqual({
      provider: PaymentProvider.GOOGLE,
      purchaseToken: 'purchase-token',
    })
  })

  it('rejects invalid Google notification payloads', () => {
    const parser = new GooglePlayNotificationParser()

    expect(() => parser.parse({ message: {} })).toThrow(
      'Google notification payload is invalid.',
    )
  })
})
