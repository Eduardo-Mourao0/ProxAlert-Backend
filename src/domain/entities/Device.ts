import { randomUUID } from 'crypto'
import { BusinessError } from '../errors/business-error'

export enum DevicePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
}

export interface DeviceProps {
  id?: string
  userId: string
  pushToken: string
  platform: DevicePlatform
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface DevicePrimitives {
  id: string
  userId: string
  pushToken: string
  platform: DevicePlatform
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class Device {
  public readonly id: string
  public userId: string
  public pushToken: string
  public platform: DevicePlatform
  public isActive: boolean
  public readonly createdAt: Date
  public updatedAt: Date

  private constructor(props: DeviceProps) {
    this.id = props.id ?? randomUUID()
    this.userId = props.userId
    this.pushToken = props.pushToken
    this.platform = props.platform
    this.isActive = props.isActive ?? true
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()
  }

  static create(props: DeviceProps): Device {
    Device.validate(props)

    return new Device(props)
  }

  static createFromPrimitives(data: DevicePrimitives): Device {
    return new Device(data)
  }

  assignToUser(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new BusinessError('User id is required.', 400)
    }

    this.userId = userId
    this.isActive = true
    this.touch()
  }

  updatePushToken(pushToken: string): void {
    if (!pushToken || pushToken.trim().length === 0) {
      throw new BusinessError('Push token is required.', 400)
    }

    this.pushToken = pushToken.trim()
    this.isActive = true
    this.touch()
  }

  deactivate(): void {
    this.isActive = false
    this.touch()
  }

  private touch(): void {
    this.updatedAt = new Date()
  }

  private static validate(props: DeviceProps): void {
    if (!props.userId || props.userId.trim().length === 0) {
      throw new BusinessError('User id is required.', 400)
    }

    if (!props.pushToken || props.pushToken.trim().length === 0) {
      throw new BusinessError('Push token is required.', 400)
    }

    if (!Object.values(DevicePlatform).includes(props.platform)) {
      throw new BusinessError('Device platform is invalid.', 400)
    }
  }
}
