import { InvalidDestinationAddressError } from '../errors/invalid-destination-address-error'
import { Location, type LocationProps } from './Location'

export interface DestinationProps extends LocationProps {
  address?: string | null
}

export class Destination {
  public readonly location: Location
  public readonly address: string | null

  private constructor(props: DestinationProps) {
    this.location = Location.create({
      latitude: props.latitude,
      longitude: props.longitude,
    })
    this.address = props.address?.trim() || null
  }

  static create(props: DestinationProps): Destination {
    Destination.validate(props)

    return new Destination(props)
  }

  get latitude(): number {
    return this.location.latitude
  }

  get longitude(): number {
    return this.location.longitude
  }

  private static validate(props: DestinationProps): void {
    if (props.address && props.address.trim().length > 255) {
      throw new InvalidDestinationAddressError()
    }
  }
}
