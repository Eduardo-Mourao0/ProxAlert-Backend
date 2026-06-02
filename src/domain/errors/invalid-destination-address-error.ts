import { BusinessError } from './business-error'

export class InvalidDestinationAddressError extends BusinessError {
  constructor() {
    super('Destination address must have at most 255 characters.', 400)
  }
}
