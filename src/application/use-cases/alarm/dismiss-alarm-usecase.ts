import { Inject, Injectable } from '@nestjs/common'
import { AlarmProximityState } from '../../../domain/entities/AlarmProximityState'
import { BusinessError } from '../../../domain/errors/business-error'
import {
  ALARM_PROXIMITY_STATE_REPOSITORY,
  type AlarmProximityStateRepository,
} from '../../../domain/repositories/alarm-proximity-state-repository'
import {
  ALARM_REPOSITORY,
  type AlarmRepository,
} from '../../../domain/repositories/alarm-repository'

export interface DismissAlarmRequest {
  alarmId: string
  userId: string
}

export interface DismissAlarmResponse {
  dismissed: boolean
}

@Injectable()
export class DismissAlarmUseCase {
  constructor(
    @Inject(ALARM_REPOSITORY)
    private readonly alarmRepository: AlarmRepository,
    @Inject(ALARM_PROXIMITY_STATE_REPOSITORY)
    private readonly alarmProximityStateRepository: AlarmProximityStateRepository,
  ) {}

  async execute(request: DismissAlarmRequest): Promise<DismissAlarmResponse> {
    const alarm = await this.alarmRepository.findById(request.alarmId)

    if (!alarm || alarm.userId !== request.userId) {
      throw new BusinessError('Alarm not found.', 404)
    }

    const state =
      (await this.alarmProximityStateRepository.findByAlarmIdAndUserId(
        request.alarmId,
        request.userId,
      )) ??
      AlarmProximityState.create({
        alarmId: request.alarmId,
        userId: request.userId,
        isInsideRadius: true,
      })

    state.dismissUntilExit()
    await this.alarmProximityStateRepository.save(state)

    return { dismissed: true }
  }
}
