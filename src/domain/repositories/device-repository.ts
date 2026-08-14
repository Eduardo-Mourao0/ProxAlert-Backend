import { Device } from '../entities/Device'

export const DEVICE_REPOSITORY = Symbol('DEVICE_REPOSITORY')

export interface DeviceRepository {
  create(device: Device): Promise<Device>
  findById(id: string): Promise<Device | null>
  findByPushToken(pushToken: string): Promise<Device | null>
  findByUserId(userId: string): Promise<Device[]>
  update(device: Device): Promise<Device>
}
