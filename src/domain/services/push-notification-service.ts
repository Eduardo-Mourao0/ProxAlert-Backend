export const PUSH_NOTIFICATION_SERVICE = Symbol('PUSH_NOTIFICATION_SERVICE')

export interface PushNotificationMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export interface PushNotificationService {
  send(message: PushNotificationMessage): Promise<void>
}
