import { Inject, Injectable } from '@nestjs/common'
import {
  ALARM_PROXIMITY_STATE_REPOSITORY,
  type AlarmProximityStateRepository,
} from '../../../domain/repositories/alarm-proximity-state-repository'
import {
  ALARM_REPOSITORY,
  type AlarmRepository,
} from '../../../domain/repositories/alarm-repository'
import { Alarm } from '../../../domain/entities/Alarm'
import { AlarmProximityState } from '../../../domain/entities/AlarmProximityState'
import { DistanceCalculator } from '../../../domain/services/distance-calculator'
import { AlarmDTO, toAlarmDTO } from '../../dtos/alarm-dto'

export interface CheckAlarmProximityRequest {
  userId: string
  latitude: number
  longitude: number
}

export interface CheckAlarmProximityResponse {
  triggeredAlarms: AlarmDTO[]
}

@Injectable()
export class CheckAlarmProximityUseCase {
  constructor(
    @Inject(ALARM_REPOSITORY)
    private readonly alarmRepository: AlarmRepository,
    @Inject(ALARM_PROXIMITY_STATE_REPOSITORY)
    private readonly alarmProximityStateRepository: AlarmProximityStateRepository,
  ) {}

  async execute(request: CheckAlarmProximityRequest): Promise<CheckAlarmProximityResponse> {
    const alarms = await this.alarmRepository.findByUserId(request.userId)
    const triggeredAlarms: AlarmDTO[] = []

    for (const alarm of alarms.filter((currentAlarm) => currentAlarm.isActive)) {
      const shouldTrigger = await this.updateAlarmProximityState(alarm, request)

      if (shouldTrigger) {
        triggeredAlarms.push(toAlarmDTO(alarm))
      }
    }

    return { triggeredAlarms }
  }

  private async updateAlarmProximityState(alarm: Alarm, request: CheckAlarmProximityRequest): Promise<boolean> {
    const distance = DistanceCalculator.calculateInMeters(
      {
        latitude: request.latitude,
        longitude: request.longitude,
      },
      {
        latitude: alarm.latitude,
        longitude: alarm.longitude,
      },
    )
    const isInsideRadius = distance <= alarm.radius
    const state =
      await this.alarmProximityStateRepository.findByAlarmIdAndUserId(
        alarm.id,
        request.userId,
      )

    if (!state && !isInsideRadius) {
      return false
    }

    const proximityState =
      state ??
      AlarmProximityState.create({
        alarmId: alarm.id,
        userId: request.userId,
      })

    if (!isInsideRadius) {
      proximityState.registerOutside(distance)
      await this.alarmProximityStateRepository.save(proximityState)
      return false
    }

    if (proximityState.dismissedUntilExit) {
      proximityState.registerInside(distance)
      await this.alarmProximityStateRepository.save(proximityState)
      return false
    }

    proximityState.registerTrigger(distance)
    await this.alarmProximityStateRepository.save(proximityState)
    return true
  }
}
