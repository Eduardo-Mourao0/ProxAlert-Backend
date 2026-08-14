import { RegisterDeviceUseCase } from '../../../../../src/application/use-cases/device/register-device-usecase'
import { Device, DevicePlatform } from '../../../../../src/domain/entities/Device'
import type { DeviceRepository } from '../../../../../src/domain/repositories/device-repository'

class FakeDeviceRepository implements DeviceRepository {
  devices: Device[] = []

  async create(device: Device): Promise<Device> {
    this.devices.push(device)
    return device
  }

  async findById(id: string): Promise<Device | null> {
    return this.devices.find((device) => device.id === id) ?? null
  }

  async findByPushToken(pushToken: string): Promise<Device | null> {
    return (
      this.devices.find((device) => device.pushToken === pushToken) ?? null
    )
  }

  async findByUserId(userId: string): Promise<Device[]> {
    return this.devices.filter((device) => device.userId === userId)
  }

  async update(device: Device): Promise<Device> {
    this.devices = this.devices.map((currentDevice) =>
      currentDevice.id === device.id ? device : currentDevice,
    )
    return device
  }
}

describe('RegisterDeviceUseCase', () => {
  let deviceRepository: FakeDeviceRepository
  let useCase: RegisterDeviceUseCase

  beforeEach(() => {
    deviceRepository = new FakeDeviceRepository()
    useCase = new RegisterDeviceUseCase(deviceRepository)
  })

  it('registers a new device', async () => {
    const result = await useCase.execute({
      userId: 'user-id',
      pushToken: 'push-token',
      platform: DevicePlatform.ANDROID,
    })

    expect(result.pushToken).toBe('push-token')
    expect(result.platform).toBe(DevicePlatform.ANDROID)
    expect(deviceRepository.devices).toHaveLength(1)
  })

  it('reactivates an existing device token for the authenticated user', async () => {
    const device = Device.create({
      userId: 'old-user-id',
      pushToken: 'push-token',
      platform: DevicePlatform.IOS,
      isActive: false,
    })
    deviceRepository.devices.push(device)

    const result = await useCase.execute({
      userId: 'new-user-id',
      pushToken: 'push-token',
      platform: DevicePlatform.ANDROID,
    })

    expect(result.id).toBe(device.id)
    expect(result.userId).toBe('new-user-id')
    expect(result.platform).toBe(DevicePlatform.ANDROID)
    expect(result.isActive).toBe(true)
    expect(deviceRepository.devices).toHaveLength(1)
  })
})
