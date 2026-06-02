import { Location } from '../../../../src/domain/entities/Location'
import { InvalidAlarmCoordinatesError } from '../../../../src/domain/errors/invalid-alarm-coordinates-error'

describe('Location entity', () => {
  it('creates a valid location', () => {
    const location = Location.create({
      latitude: -23.5505,
      longitude: -46.6333,
    })

    expect(location.latitude).toBe(-23.5505)
    expect(location.longitude).toBe(-46.6333)
  })

  it('rejects invalid latitude', () => {
    expect(() =>
      Location.create({
        latitude: 91,
        longitude: -46.6333,
      }),
    ).toThrow(InvalidAlarmCoordinatesError)
  })

  it('rejects invalid longitude', () => {
    expect(() =>
      Location.create({
        latitude: -23.5505,
        longitude: 181,
      }),
    ).toThrow(InvalidAlarmCoordinatesError)
  })

  it('rejects non-finite coordinates', () => {
    expect(() =>
      Location.create({
        latitude: Number.NaN,
        longitude: -46.6333,
      }),
    ).toThrow(InvalidAlarmCoordinatesError)

    expect(() =>
      Location.create({
        latitude: -23.5505,
        longitude: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(InvalidAlarmCoordinatesError)
  })
})
