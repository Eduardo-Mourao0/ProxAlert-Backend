import { BusinessError } from './business-error'

export class InvalidAlarmDescriptionError extends BusinessError {
  constructor() {
    super('Alarm description cannot be longer than 255 characters.')
    this.name = 'InvalidAlarmDescriptionError'
  }
}
