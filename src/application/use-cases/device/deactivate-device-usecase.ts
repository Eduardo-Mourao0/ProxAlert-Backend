import { Inject, Injectable } from '@nestjs/common'
import { BusinessError } from '../../../domain/errors/business-error'
import {
  DEVICE_REPOSITORY,
  type DeviceRepository,
} from '../../../domain/repositories/device-repository'

export interface DeactivateDeviceRequest {
  userId: string
  deviceId: string
}

@Injectable()
export class DeactivateDeviceUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY)
    private readonly deviceRepository: DeviceRepository,
  ) {}

  async execute(request: DeactivateDeviceRequest): Promise<{ deactivated: true }> {
    const device = await this.deviceRepository.findById(request.deviceId)

    if (!device || device.userId !== request.userId) {
      throw new BusinessError('Device not found.', 404)
    }

    device.deactivate()
    await this.deviceRepository.update(device)

    return { deactivated: true }
  }
}
