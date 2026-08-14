import { Device, DevicePlatform } from '../../domain/entities/Device'

export interface DeviceDTO {
  id: string
  userId: string
  pushToken: string
  platform: DevicePlatform
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function toDeviceDTO(device: Device): DeviceDTO {
  return {
    id: device.id,
    userId: device.userId,
    pushToken: device.pushToken,
    platform: device.platform,
    isActive: device.isActive,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  }
}
