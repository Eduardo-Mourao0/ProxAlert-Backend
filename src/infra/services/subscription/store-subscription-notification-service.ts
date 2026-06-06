import { Injectable } from '@nestjs/common'
import { PaymentProvider } from '../../../domain/entities/Subscription'
import { BusinessError } from '../../../domain/errors/business-error'
import {
  ParsedSubscriptionNotification,
  ParseSubscriptionNotificationRequest,
  SubscriptionNotificationService,
} from '../../../domain/services/subscription-notification-service'
import { AppleStoreNotificationParser } from './apple-store-notification-parser'
import { GooglePlayNotificationParser } from './google-play-notification-parser'

@Injectable()
export class StoreSubscriptionNotificationService
  implements SubscriptionNotificationService
{
  constructor(
    private readonly googlePlayNotificationParser: GooglePlayNotificationParser,
    private readonly appleStoreNotificationParser: AppleStoreNotificationParser,
  ) {}

  parseNotification(
    request: ParseSubscriptionNotificationRequest,
  ): ParsedSubscriptionNotification {
    if (request.provider === PaymentProvider.GOOGLE) {
      return this.googlePlayNotificationParser.parse(request.body)
    }

    if (request.provider === PaymentProvider.APPLE) {
      return this.appleStoreNotificationParser.parse(request.body)
    }

    throw new BusinessError('Payment provider is not supported.', 400)
  }
}
