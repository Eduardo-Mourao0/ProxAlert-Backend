import { randomUUID } from 'crypto'
import { InvalidAlarmDescriptionError } from '../errors/invalid-alarm-description-error'
import { InvalidAlarmRadiusError } from '../errors/invalid-alarm-radius-error'
import { InvalidAlarmTitleError } from '../errors/invalid-alarm-title-error'
import { InvalidAlarmUserError } from '../errors/invalid-alarm-user-error'
import { Destination } from './Destination'
import { Location } from './Location'

export interface AlarmProps {
  id?: string
  userId: string
  title: string
  description?: string | null
  address?: string | null
  isActive?: boolean
  latitude: number
  longitude: number
  radius: number
  createdAt?: Date
}

export class Alarm {
  public readonly id: string
  public readonly userId: string
  public title: string
  public description: string | null
  public isActive: boolean
  public destination: Destination
  public radius: number
  public readonly createdAt: Date

  private constructor(props: AlarmProps) {
    this.id = props.id ?? randomUUID()
    this.userId = props.userId
    this.title = props.title.trim()
    this.description = props.description?.trim() || null
    this.isActive = props.isActive ?? true
    this.destination = Destination.create({
      address: props.address,
      latitude: props.latitude,
      longitude: props.longitude,
    })
    this.radius = props.radius
    this.createdAt = props.createdAt ?? new Date()
  }

  static create(props: AlarmProps): Alarm {
    Alarm.validate(props)

    return new Alarm(props)
  }

  static createFromPrimitives(data: {
    id: string
    userId: string
    title: string
    description?: string | null
    address?: string | null
    isActive: boolean
    latitude: number
    longitude: number
    radius: number
    createdAt: Date
  }): Alarm {
    return new Alarm(data)
  }

  get address(): string | null {
    return this.destination.address
  }

  get location(): Location {
    return this.destination.location
  }

  get latitude(): number {
    return this.destination.latitude
  }

  get longitude(): number {
    return this.destination.longitude
  }

  update(props: {
    title?: string
    description?: string | null
    address?: string | null
    latitude?: number
    longitude?: number
    radius?: number
  }) {
    const updatedProps = {
      id: this.id,
      userId: this.userId,
      title: props.title ?? this.title,
      description: props.description !== undefined ? props.description : this.description,
      address: props.address !== undefined ? props.address : this.address,
      isActive: this.isActive,
      latitude: props.latitude ?? this.latitude,
      longitude: props.longitude ?? this.longitude,
      radius: props.radius ?? this.radius,
      createdAt: this.createdAt,
    }

    Alarm.validate(updatedProps)

    this.title = updatedProps.title
    this.description = updatedProps.description ?? null
    this.destination = Destination.create({
      address: updatedProps.address,
      latitude: updatedProps.latitude,
      longitude: updatedProps.longitude,
    })
    this.radius = updatedProps.radius
  }

  toggleStatus(): void {
    this.isActive = !this.isActive
  }

  private static validate(props: AlarmProps): void {
    if (!props.userId || props.userId.trim().length === 0) {
      throw new InvalidAlarmUserError()
    }

    if (!props.title || props.title.trim().length === 0) {
      throw new InvalidAlarmTitleError()
    }

    if (props.title.trim().length > 80) {
      throw new InvalidAlarmTitleError()
    }

    if (props.description && props.description.trim().length > 255) {
      throw new InvalidAlarmDescriptionError()
    }

    if (!Number.isFinite(props.radius) || props.radius < 50 || props.radius > 50000) {
      throw new InvalidAlarmRadiusError()
    }
  }
}
