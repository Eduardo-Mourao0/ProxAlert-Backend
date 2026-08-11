import { AlarmTrigger } from '../../../../src/domain/entities/AlarmTrigger'
import { BusinessError } from '../../../../src/domain/errors/business-error'

describe('AlarmTrigger', () => {
  it('creates an alarm trigger with valid data', () => {
    const alarmTrigger = AlarmTrigger.create({
      alarmId: 'alarm-id',
      userId: 'user-id',
      latitude: -23.5505,
      longitude: -46.6333,
      distanceInMeters: 120,
    })

    expect(alarmTrigger.id).toEqual(expect.any(String))
    expect(alarmTrigger.alarmId).toBe('alarm-id')
    expect(alarmTrigger.userId).toBe('user-id')
    expect(alarmTrigger.triggeredAt).toBeInstanceOf(Date)
  })

  it('does not create an alarm trigger with invalid coordinates', () => {
    expect(() =>
      AlarmTrigger.create({
        alarmId: 'alarm-id',
        userId: 'user-id',
        latitude: -100,
        longitude: -46.6333,
        distanceInMeters: 120,
      }),
    ).toThrow(BusinessError)
  })

  it('does not create an alarm trigger with invalid distance', () => {
    expect(() =>
      AlarmTrigger.create({
        alarmId: 'alarm-id',
        userId: 'user-id',
        latitude: -23.5505,
        longitude: -46.6333,
        distanceInMeters: -1,
      }),
    ).toThrow(BusinessError)
  })
})
