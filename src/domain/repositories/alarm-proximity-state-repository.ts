import { AlarmProximityState } from '../entities/AlarmProximityState'

export const ALARM_PROXIMITY_STATE_REPOSITORY = Symbol(
  'ALARM_PROXIMITY_STATE_REPOSITORY',
)

export interface AlarmProximityStateRepository {
  findByAlarmIdAndUserId(
    alarmId: string,
    userId: string,
  ): Promise<AlarmProximityState | null>
  save(state: AlarmProximityState): Promise<AlarmProximityState>
}
