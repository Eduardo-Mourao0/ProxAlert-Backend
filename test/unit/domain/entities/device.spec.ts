import { Device, DevicePlatform } from '../../../../src/domain/entities/Device'
import { BusinessError } from '../../../../src/domain/errors/business-error'

describe('Device', () => {
  it('creates a device with valid data', () => {
    const device = Device.create({
      userId: 'user-id',
      pushToken: 'push-token',
      platform: DevicePlatform.ANDROID,
    })

    expect(device.id).toEqual(expect.any(String))
    expect(device.userId).toBe('user-id')
    expect(device.pushToken).toBe('push-token')
    expect(device.platform).toBe(DevicePlatform.ANDROID)
    expect(device.isActive).toBe(true)
  })

  it('does not create a device without push token', () => {
    expect(() =>
      Device.create({
        userId: 'user-id',
        pushToken: '',
        platform: DevicePlatform.IOS,
      }),
    ).toThrow(BusinessError)
  })

  it('deactivates a device', () => {
    const device = Device.create({
      userId: 'user-id',
      pushToken: 'push-token',
      platform: DevicePlatform.IOS,
    })

    device.deactivate()

    expect(device.isActive).toBe(false)
  })
})
