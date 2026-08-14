import { Inject, Injectable } from '@nestjs/common'
import { Device, DevicePlatform } from '../../../domain/entities/Device'
import {
  DEVICE_REPOSITORY,
  type DeviceRepository,
} from '../../../domain/repositories/device-repository'
import { DeviceDTO, toDeviceDTO } from '../../dtos/device-dto'

export interface RegisterDeviceRequest {
  userId: string
  pushToken: string
  platform: DevicePlatform
}

@Injectable()
export class RegisterDeviceUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY)
    private readonly deviceRepository: DeviceRepository,
  ) {}

  async execute(request: RegisterDeviceRequest): Promise<DeviceDTO> {
    const existingDevice = await this.deviceRepository.findByPushToken(
      request.pushToken,
    )

    if (existingDevice) {
      existingDevice.assignToUser(request.userId)
      existingDevice.platform = request.platform

      return toDeviceDTO(await this.deviceRepository.update(existingDevice))
    }

    const device = Device.create({
      userId: request.userId,
      pushToken: request.pushToken,
      platform: request.platform,
    })

    return toDeviceDTO(await this.deviceRepository.create(device))
  }
}
