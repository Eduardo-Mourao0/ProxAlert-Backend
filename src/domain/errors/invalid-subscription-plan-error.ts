import { BusinessError } from './business-error'

export class InvalidSubscriptionPlanError extends BusinessError {
  constructor() {
    super('Subscription plan must be PREMIUM.', 400)
  }
}
