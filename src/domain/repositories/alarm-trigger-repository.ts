import { AlarmTrigger } from '../entities/AlarmTrigger'

export const ALARM_TRIGGER_REPOSITORY = Symbol('ALARM_TRIGGER_REPOSITORY')

export interface AlarmTriggerRepository {
  create(alarmTrigger: AlarmTrigger): Promise<AlarmTrigger>
  findByAlarmId(alarmId: string): Promise<AlarmTrigger[]>
}
