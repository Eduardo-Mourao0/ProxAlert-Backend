import { randomUUID } from 'crypto'
import { BusinessError } from '../errors/business-error'

export interface AlarmTriggerProps {
  id?: string
  alarmId: string
  userId: string
  latitude: number
  longitude: number
  distanceInMeters: number
  triggeredAt?: Date
}

export interface AlarmTriggerPrimitives {
  id: string
  alarmId: string
  userId: string
  latitude: number
  longitude: number
  distanceInMeters: number
  triggeredAt: Date
}

export class AlarmTrigger {
  public readonly id: string
  public readonly alarmId: string
  public readonly userId: string
  public readonly latitude: number
  public readonly longitude: number
  public readonly distanceInMeters: number
  public readonly triggeredAt: Date

  private constructor(props: AlarmTriggerProps) {
    this.id = props.id ?? randomUUID()
    this.alarmId = props.alarmId
    this.userId = props.userId
    this.latitude = props.latitude
    this.longitude = props.longitude
    this.distanceInMeters = props.distanceInMeters
    this.triggeredAt = props.triggeredAt ?? new Date()
  }

  static create(props: AlarmTriggerProps): AlarmTrigger {
    AlarmTrigger.validate(props)

    return new AlarmTrigger(props)
  }

  static createFromPrimitives(data: AlarmTriggerPrimitives): AlarmTrigger {
    return new AlarmTrigger(data)
  }

  private static validate(props: AlarmTriggerProps): void {
    if (!props.alarmId || props.alarmId.trim().length === 0) {
      throw new BusinessError('Alarm id is required.', 400)
    }

    if (!props.userId || props.userId.trim().length === 0) {
      throw new BusinessError('User id is required.', 400)
    }

    if (!Number.isFinite(props.latitude) || props.latitude < -90 || props.latitude > 90) {
      throw new BusinessError('Latitude is invalid.', 400)
    }

    if (!Number.isFinite(props.longitude) || props.longitude < -180 || props.longitude > 180) {
      throw new BusinessError('Longitude is invalid.', 400)
    }

    if (!Number.isFinite(props.distanceInMeters) || props.distanceInMeters < 0) {
      throw new BusinessError('Distance is invalid.', 400)
    }
  }
}
