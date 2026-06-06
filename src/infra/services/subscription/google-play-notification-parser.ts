import { Injectable } from '@nestjs/common'
import { PaymentProvider } from '../../../domain/entities/Subscription'
import { BusinessError } from '../../../domain/errors/business-error'
import { ParsedSubscriptionNotification } from '../../../domain/services/subscription-notification-service'

interface GooglePubSubPushBody {
  message?: {
    data?: string
  }
}

interface GoogleRealTimeDeveloperNotification {
  subscriptionNotification?: {
    purchaseToken?: string
  }
}

@Injectable()
export class GooglePlayNotificationParser {
  parse(body: unknown): ParsedSubscriptionNotification {
    const pushBody = body as GooglePubSubPushBody
    const data = pushBody.message?.data

    if (!data) {
      throw new BusinessError('Google notification payload is invalid.', 400)
    }

    const notification = this.decodeNotification(data)
    const purchaseToken =
      notification.subscriptionNotification?.purchaseToken

    if (!purchaseToken) {
      throw new BusinessError('Google subscription token is missing.', 400)
    }

    return {
      provider: PaymentProvider.GOOGLE,
      purchaseToken,
    }
  }

  private decodeNotification(
    data: string,
  ): GoogleRealTimeDeveloperNotification {
    try {
      const json = Buffer.from(data, 'base64').toString('utf8')
      return JSON.parse(json) as GoogleRealTimeDeveloperNotification
    } catch {
      throw new BusinessError('Google notification payload is invalid.', 400)
    }
  }
}
