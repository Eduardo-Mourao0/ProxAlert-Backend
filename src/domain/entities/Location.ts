import { InvalidAlarmCoordinatesError } from '../errors/invalid-alarm-coordinates-error'

export interface LocationProps {
  latitude: number
  longitude: number
}

export class Location {
  public readonly latitude: number
  public readonly longitude: number

  private constructor(props: LocationProps) {
    this.latitude = props.latitude
    this.longitude = props.longitude
  }

  static create(props: LocationProps): Location {
    Location.validate(props)

    return new Location(props)
  }

  private static validate(props: LocationProps): void {
    if (!Number.isFinite(props.latitude) || !Number.isFinite(props.longitude)) {
      throw new InvalidAlarmCoordinatesError()
    }

    if (props.latitude < -90 || props.latitude > 90) {
      throw new InvalidAlarmCoordinatesError()
    }

    if (props.longitude < -180 || props.longitude > 180) {
      throw new InvalidAlarmCoordinatesError()
    }
  }
}

