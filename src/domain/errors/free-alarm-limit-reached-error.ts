import { BusinessError } from './business-error'

export class FreeAlarmLimitReachedError extends BusinessError {
  constructor() {
    super('Free users can create up to 3 alarms.', 403)
    this.name = 'FreeAlarmLimitReachedError'
  }
}
