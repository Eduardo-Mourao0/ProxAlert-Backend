import { BusinessError } from './business-error'

export class InvalidSubscriptionUserError extends BusinessError {
  constructor() {
    super('Subscription user is required.', 400)
  }
}
