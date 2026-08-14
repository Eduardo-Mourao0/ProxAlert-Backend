import { Injectable } from '@nestjs/common'
import {
  DeactivateDeviceRequest,
  DeactivateDeviceUseCase,
} from '../../../application/use-cases/device/deactivate-device-usecase'
import {
  ListUserDevicesRequest,
  ListUserDevicesUseCase,
} from '../../../application/use-cases/device/list-user-devices-usecase'
import {
  RegisterDeviceRequest,
  RegisterDeviceUseCase,
} from '../../../application/use-cases/device/register-device-usecase'

@Injectable()
export class DeviceService {
  constructor(
    private readonly registerDeviceUseCase: RegisterDeviceUseCase,
    private readonly listUserDevicesUseCase: ListUserDevicesUseCase,
    private readonly deactivateDeviceUseCase: DeactivateDeviceUseCase,
  ) {}

  register(data: RegisterDeviceRequest) {
    return this.registerDeviceUseCase.execute(data)
  }

  listByUser(data: ListUserDevicesRequest) {
    return this.listUserDevicesUseCase.execute(data)
  }

  deactivate(data: DeactivateDeviceRequest) {
    return this.deactivateDeviceUseCase.execute(data)
  }
}
