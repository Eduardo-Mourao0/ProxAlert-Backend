import { Injectable } from '@nestjs/common'
import { decode } from 'jsonwebtoken'
import { PaymentProvider } from '../../../domain/entities/Subscription'
import { BusinessError } from '../../../domain/errors/business-error'
import { ParsedSubscriptionNotification } from '../../../domain/services/subscription-notification-service'

interface AppleNotificationBody {
  signedPayload?: string
}

interface AppleNotificationPayload {
  data?: {
    signedTransactionInfo?: string
  }
}

interface AppleTransactionPayload {
  originalTransactionId?: string
  transactionId?: string
}

@Injectable()
export class AppleStoreNotificationParser {
  parse(body: unknown): ParsedSubscriptionNotification {
    const signedPayload = (body as AppleNotificationBody).signedPayload

    if (!signedPayload) {
      throw new BusinessError('Apple notification payload is invalid.', 400)
    }

    const payload = this.decodeJwt<AppleNotificationPayload>(signedPayload)
    const transaction = this.decodeJwt<AppleTransactionPayload>(
      payload.data?.signedTransactionInfo,
    )
    const transactionId =
      transaction.originalTransactionId ?? transaction.transactionId

    if (!transactionId) {
      throw new BusinessError('Apple transaction id is missing.', 400)
    }

    return {
      provider: PaymentProvider.APPLE,
      purchaseToken: transactionId,
    }
  }

  private decodeJwt<T>(token: string | undefined): T {
    if (!token) {
      throw new BusinessError('Apple notification payload is invalid.', 400)
    }

    const payload = decode(token)

    if (!payload || typeof payload === 'string') {
      throw new BusinessError('Apple notification payload is invalid.', 400)
    }

    return payload as T
  }
}
