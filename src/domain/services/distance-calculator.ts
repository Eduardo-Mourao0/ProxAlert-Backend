export interface Coordinates {
    latitude: number
    longitude: number
}

export class DistanceCalculator {
    private static readonly EARTH_RADIUS_IN_METERS = 6371000

    static calculateInMeters(from: Coordinates, to: Coordinates): number {
        const fromLatitude = this.toRadians(from.latitude)
        const toLatitude = this.toRadians(to.longitude)

        const deltaLatitude = this.toRadians(to.latitude - from.latitude)
        const deltaLongitude = this.toRadians(to.longitude - from.longitude)

        const haversine = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2

        const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))

        return this.EARTH_RADIUS_IN_METERS * centralAngle
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180)
    }
}