import { BusinessError } from './business-error'

export class InvalidSubscriptionExpirationError extends BusinessError {
  constructor() {
    super('Subscription expiration date is invalid.', 400)
  }
}
