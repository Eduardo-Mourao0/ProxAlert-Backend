import { Destination } from '../../../../src/domain/entities/Destination'
import { Location } from '../../../../src/domain/entities/Location'
import { InvalidAlarmCoordinatesError } from '../../../../src/domain/errors/invalid-alarm-coordinates-error'
import { InvalidDestinationAddressError } from '../../../../src/domain/errors/invalid-destination-address-error'

describe('Destination entity', () => {
  it('creates a destination with location and normalized address', () => {
    const destination = Destination.create({
      address: ' Av. Paulista, 1000 - Sao Paulo ',
      latitude: -23.5505,
      longitude: -46.6333,
    })

    expect(destination.address).toBe('Av. Paulista, 1000 - Sao Paulo')
    expect(destination.location).toBeInstanceOf(Location)
    expect(destination.latitude).toBe(-23.5505)
    expect(destination.longitude).toBe(-46.6333)
  })

  it('accepts destinations without an address', () => {
    const destination = Destination.create({
      latitude: -23.5505,
      longitude: -46.6333,
    })

    expect(destination.address).toBeNull()
  })

  it('rejects invalid coordinates', () => {
    expect(() =>
      Destination.create({
        address: 'Av. Paulista, 1000 - Sao Paulo',
        latitude: 91,
        longitude: -46.6333,
      }),
    ).toThrow(InvalidAlarmCoordinatesError)
  })

  it('rejects long addresses', () => {
    expect(() =>
      Destination.create({
        address: 'a'.repeat(256),
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    ).toThrow(InvalidDestinationAddressError)
  })
})
