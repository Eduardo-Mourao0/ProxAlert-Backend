import { BusinessError } from './business-error'

export class InvalidAlarmCoordinatesError extends BusinessError {
  constructor() {
    super('Alarm coordinates are invalid.')
    this.name = 'InvalidAlarmCoordinatesError'
  }
}
