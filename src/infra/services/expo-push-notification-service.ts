import { Injectable } from '@nestjs/common'
import {
  PushNotificationMessage,
  PushNotificationService,
} from '../../domain/services/push-notification-service'

@Injectable()
export class ExpoPushNotificationService implements PushNotificationService {
  private readonly endpoint = 'https://exp.host/--/api/v2/push/send'

  async send(message: PushNotificationMessage): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(process.env.EXPO_ACCESS_TOKEN && {
          Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
        }),
      },
      body: JSON.stringify({
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data,
      }),
    })

    if (!response.ok) {
      throw new Error(`Expo push notification failed with status ${response.status}.`)
    }
  }
}
