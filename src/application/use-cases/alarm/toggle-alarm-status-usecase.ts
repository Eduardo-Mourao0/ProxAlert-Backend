import { Inject, Injectable } from '@nestjs/common'
import { AlarmDTO, toAlarmDTO } from '../../dtos/alarm-dto'
import { BusinessError } from '../../../domain/errors/business-error'
import { ALARM_REPOSITORY, type AlarmRepository } from '../../../domain/repositories/alarm-repository'

export interface ToggleAlarmStatusRequest {
  alarmId: string
  userId: string
}

@Injectable()
export class ToggleAlarmStatusUseCase {
  constructor(
    @Inject(ALARM_REPOSITORY)
    private readonly alarmRepository: AlarmRepository,
  ) {}

  async execute(request: ToggleAlarmStatusRequest): Promise<AlarmDTO> {
    const alarm = await this.alarmRepository.findById(request.alarmId)

    if (!alarm || alarm.userId !== request.userId) {
      throw new BusinessError('Alarm not found.', 404)
    }

    alarm.toggleStatus()

    const updatedAlarm = await this.alarmRepository.update(alarm)

    return toAlarmDTO(updatedAlarm)
  }
}
