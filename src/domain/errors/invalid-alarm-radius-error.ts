import { BusinessError } from './business-error'

export class InvalidAlarmRadiusError extends BusinessError {
  constructor() {
    super('Alarm radius must be between 50 and 50000 meters.')
    this.name = 'InvalidAlarmRadiusError'
  }
}
