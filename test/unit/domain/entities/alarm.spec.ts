import { Alarm } from '../../../../src/domain/entities/Alarm'
import { Destination } from '../../../../src/domain/entities/Destination'
import { Location } from '../../../../src/domain/entities/Location'
import { InvalidAlarmCoordinatesError } from '../../../../src/domain/errors/invalid-alarm-coordinates-error'
import { InvalidAlarmRadiusError } from '../../../../src/domain/errors/invalid-alarm-radius-error'
import { InvalidAlarmTitleError } from '../../../../src/domain/errors/invalid-alarm-title-error'
import { InvalidAlarmUserError } from '../../../../src/domain/errors/invalid-alarm-user-error'

const validAlarmProps = {
  userId: 'user-id',
  title: 'Casa',
  description: 'Chegando em casa',
  address: 'Av. Paulista, 1000 - Sao Paulo',
  latitude: -23.5505,
  longitude: -46.6333,
  radius: 500,
}

describe('Alarm entity', () => {
  it('creates an active alarm with normalized text', () => {
    const alarm = Alarm.create({
      ...validAlarmProps,
      title: ' Casa ',
      description: ' Chegando em casa ',
    })

    expect(alarm.id).toEqual(expect.any(String))
    expect(alarm.title).toBe('Casa')
    expect(alarm.description).toBe('Chegando em casa')
    expect(alarm.address).toBe('Av. Paulista, 1000 - Sao Paulo')
    expect(alarm.isActive).toBe(true)
    expect(alarm.destination).toBeInstanceOf(Destination)
    expect(alarm.location).toBeInstanceOf(Location)
    expect(alarm.latitude).toBe(-23.5505)
    expect(alarm.longitude).toBe(-46.6333)
  })

  it('updates alarm data using the entity validation', () => {
    const alarm = Alarm.create(validAlarmProps)

    alarm.update({
      title: 'Trabalho',
      description: null,
      address: 'Rua do Trabalho, 200',
      latitude: -22,
      longitude: -43,
      radius: 1000,
    })

    expect(alarm.title).toBe('Trabalho')
    expect(alarm.description).toBeNull()
    expect(alarm.address).toBe('Rua do Trabalho, 200')
    expect(alarm.destination).toBeInstanceOf(Destination)
    expect(alarm.location).toBeInstanceOf(Location)
    expect(alarm.latitude).toBe(-22)
    expect(alarm.longitude).toBe(-43)
    expect(alarm.radius).toBe(1000)
  })

  it('toggles active status', () => {
    const alarm = Alarm.create(validAlarmProps)

    alarm.toggleStatus()

    expect(alarm.isActive).toBe(false)
  })

  it('rejects empty user id', () => {
    expect(() =>
      Alarm.create({
        ...validAlarmProps,
        userId: '',
      }),
    ).toThrow(InvalidAlarmUserError)
  })

  it('rejects empty title', () => {
    expect(() =>
      Alarm.create({
        ...validAlarmProps,
        title: '   ',
      }),
    ).toThrow(InvalidAlarmTitleError)
  })

  it('rejects invalid coordinates', () => {
    expect(() =>
      Alarm.create({
        ...validAlarmProps,
        latitude: 91,
      }),
    ).toThrow(InvalidAlarmCoordinatesError)
  })

  it('rejects invalid radius', () => {
    expect(() =>
      Alarm.create({
        ...validAlarmProps,
        radius: 49,
      }),
    ).toThrow(InvalidAlarmRadiusError)
  })

  it('rejects long addresses', () => {
    expect(() =>
      Alarm.create({
        ...validAlarmProps,
        address: 'a'.repeat(256),
      }),
    ).toThrow()
  })
})
