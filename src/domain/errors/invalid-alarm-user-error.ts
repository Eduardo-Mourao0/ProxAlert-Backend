import { BusinessError } from './business-error'

export class InvalidAlarmUserError extends BusinessError {
  constructor() {
    super('Alarm userId is required.')
    this.name = 'InvalidAlarmUserError'
  }
}
