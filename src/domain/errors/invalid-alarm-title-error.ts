import { BusinessError } from './business-error'

export class InvalidAlarmTitleError extends BusinessError {
  constructor() {
    super('Alarm title must be between 1 and 80 characters.')
    this.name = 'InvalidAlarmTitleError'
  }
}
