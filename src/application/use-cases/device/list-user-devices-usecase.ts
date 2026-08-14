import { Inject, Injectable } from '@nestjs/common'
import {
  DEVICE_REPOSITORY,
  type DeviceRepository,
} from '../../../domain/repositories/device-repository'
import { DeviceDTO, toDeviceDTO } from '../../dtos/device-dto'

export interface ListUserDevicesRequest {
  userId: string
}

@Injectable()
export class ListUserDevicesUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY)
    private readonly deviceRepository: DeviceRepository,
  ) {}

  async execute(request: ListUserDevicesRequest): Promise<DeviceDTO[]> {
    const devices = await this.deviceRepository.findByUserId(request.userId)

    return devices.map(toDeviceDTO)
  }
}
