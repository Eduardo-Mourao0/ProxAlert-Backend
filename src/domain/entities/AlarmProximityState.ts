import { randomUUID } from 'crypto'
import { BusinessError } from '../errors/business-error'

export interface AlarmProximityStateProps {
  id?: string
  alarmId: string
  userId: string
  isInsideRadius?: boolean
  dismissedUntilExit?: boolean
  lastDistanceInMeters?: number | null
  lastTriggeredAt?: Date | null
  dismissedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export interface AlarmProximityStatePrimitives {
  id: string
  alarmId: string
  userId: string
  isInsideRadius: boolean
  dismissedUntilExit: boolean
  lastDistanceInMeters?: number | null
  lastTriggeredAt?: Date | null
  dismissedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export class AlarmProximityState {
  public readonly id: string
  public readonly alarmId: string
  public readonly userId: string
  public isInsideRadius: boolean
  public dismissedUntilExit: boolean
  public lastDistanceInMeters: number | null
  public lastTriggeredAt: Date | null
  public dismissedAt: Date | null
  public readonly createdAt: Date
  public updatedAt: Date

  private constructor(props: AlarmProximityStateProps) {
    this.id = props.id ?? randomUUID()
    this.alarmId = props.alarmId
    this.userId = props.userId
    this.isInsideRadius = props.isInsideRadius ?? false
    this.dismissedUntilExit = props.dismissedUntilExit ?? false
    this.lastDistanceInMeters = props.lastDistanceInMeters ?? null
    this.lastTriggeredAt = props.lastTriggeredAt ?? null
    this.dismissedAt = props.dismissedAt ?? null
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()
  }

  static create(props: AlarmProximityStateProps): AlarmProximityState {
    AlarmProximityState.validate(props)

    return new AlarmProximityState(props)
  }

  static createFromPrimitives(
    data: AlarmProximityStatePrimitives,
  ): AlarmProximityState {
    return new AlarmProximityState(data)
  }

  registerTrigger(distanceInMeters: number): void {
    this.ensureValidDistance(distanceInMeters)
    this.isInsideRadius = true
    this.lastDistanceInMeters = distanceInMeters
    this.lastTriggeredAt = new Date()
    this.touch()
  }

  registerInside(distanceInMeters: number): void {
    this.ensureValidDistance(distanceInMeters)
    this.isInsideRadius = true
    this.lastDistanceInMeters = distanceInMeters
    this.touch()
  }

  registerOutside(distanceInMeters: number): void {
    this.ensureValidDistance(distanceInMeters)
    this.isInsideRadius = false
    this.dismissedUntilExit = false
    this.lastDistanceInMeters = distanceInMeters
    this.dismissedAt = null
    this.touch()
  }

  dismissUntilExit(): void {
    this.isInsideRadius = true
    this.dismissedUntilExit = true
    this.dismissedAt = new Date()
    this.touch()
  }

  private touch(): void {
    this.updatedAt = new Date()
  }

  private ensureValidDistance(distanceInMeters: number): void {
    if (!Number.isFinite(distanceInMeters) || distanceInMeters < 0) {
      throw new BusinessError('Distance is invalid.', 400)
    }
  }

  private static validate(props: AlarmProximityStateProps): void {
    if (!props.alarmId || props.alarmId.trim().length === 0) {
      throw new BusinessError('Alarm id is required.', 400)
    }

    if (!props.userId || props.userId.trim().length === 0) {
      throw new BusinessError('User id is required.', 400)
    }

    if (
      props.lastDistanceInMeters !== undefined &&
      props.lastDistanceInMeters !== null &&
      (!Number.isFinite(props.lastDistanceInMeters) ||
        props.lastDistanceInMeters < 0)
    ) {
      throw new BusinessError('Distance is invalid.', 400)
    }
  }
}
