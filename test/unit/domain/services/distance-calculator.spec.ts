import { DistanceCalculator } from '../../../../src/domain/services/distance-calculator'

describe('DistanceCalculator', () => {
  it('returns zero for the same coordinates', () => {
    const distance = DistanceCalculator.calculateInMeters(
      { latitude: -23.5505, longitude: -46.6333 },
      { latitude: -23.5505, longitude: -46.6333 },
    )

    expect(distance).toBe(0)
  })

  it('calculates distance between nearby coordinates in meters', () => {
    const distance = DistanceCalculator.calculateInMeters(
      { latitude: -23.5505, longitude: -46.6333 },
      { latitude: -23.551, longitude: -46.634 },
    )

    expect(distance).toBeGreaterThan(80)
    expect(distance).toBeLessThan(100)
  })
})
