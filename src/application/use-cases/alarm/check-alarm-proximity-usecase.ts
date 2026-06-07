import { Inject, Injectable } from '@nestjs/common'
import {
  ALARM_REPOSITORY,
  type AlarmRepository,
} from '../../../domain/repositories/alarm-repository'
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
  ) {}

  async execute(
    request: CheckAlarmProximityRequest,
  ): Promise<CheckAlarmProximityResponse> {
    const alarms = await this.alarmRepository.findByUserId(request.userId)
    const triggeredAlarms = alarms
      .filter((alarm) => alarm.isActive)
      .filter((alarm) => {
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

        return distance <= alarm.radius
      })
      .map(toAlarmDTO)

    return { triggeredAlarms }
  }
}
