import { BusinessError } from './business-error'

export class InvalidSubscriptionProviderError extends BusinessError {
  constructor(provider: unknown) {
    super(`Subscription provider "${String(provider)}" is invalid.`, 400)
  }
}
