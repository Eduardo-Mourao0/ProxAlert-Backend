import { BusinessError } from './business-error'

export class InvalidSubscriptionStatusError extends BusinessError {
  constructor(status: unknown) {
    super(`Subscription status "${String(status)}" is invalid.`, 400)
  }
}
