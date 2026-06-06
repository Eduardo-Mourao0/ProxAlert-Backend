import { sign } from 'jsonwebtoken'
import { PaymentProvider } from '../../../../../src/domain/entities/Subscription'
import { AppleStoreNotificationParser } from '../../../../../src/infra/services/subscription/apple-store-notification-parser'

describe('AppleStoreNotificationParser', () => {
  it('parses an Apple signedPayload notification', () => {
    const parser = new AppleStoreNotificationParser()
    const signedTransactionInfo = sign(
      {
        originalTransactionId: 'original-transaction-id',
        transactionId: 'transaction-id',
      },
      'test-secret',
    )
    const signedPayload = sign(
      {
        data: {
          signedTransactionInfo,
        },
      },
      'test-secret',
    )

    expect(
      parser.parse({
        signedPayload,
      }),
    ).toEqual({
      provider: PaymentProvider.APPLE,
      purchaseToken: 'original-transaction-id',
    })
  })

  it('rejects invalid Apple notification payloads', () => {
    const parser = new AppleStoreNotificationParser()

    expect(() => parser.parse({})).toThrow(
      'Apple notification payload is invalid.',
    )
  })
})
