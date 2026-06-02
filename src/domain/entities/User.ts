import { randomUUID } from 'crypto'
import { InvalidEmailError } from '../errors/invalid-email-error'
import { InvalidNameError } from '../errors/invalid-name-error'
import { InvalidPlanError } from '../errors/invalid-plan-error'
import { InvalidPasswordError } from '../errors/invalid-password-error'

export enum Plan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export interface UserProps {
  id?: string
  name: string
  email: string
  password: string
  refreshTokenHash?: string | null
  plan?: Plan
  createdAt?: Date
}

export class User {
  public readonly id: string
  public name: string
  public email: string
  public password: string
  public refreshTokenHash: string | null
  public plan: Plan
  public readonly createdAt: Date

  private constructor(props: UserProps) {
    this.id = props.id ?? randomUUID()
    this.name = props.name.trim()
    this.email = props.email.trim().toLowerCase()
    this.password = props.password
    this.refreshTokenHash = props.refreshTokenHash ?? null
    this.plan = props.plan ?? Plan.FREE
    this.createdAt = props.createdAt ?? new Date()
  }

  static create(props: UserProps): User {
    const email = props.email?.trim().toLowerCase()

    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidNameError()
    }

    if (!props.password || props.password.trim().length < 4) {
      throw new InvalidPasswordError()
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      throw new InvalidEmailError(props.email)
    }

    if (props.plan && !Object.values(Plan).includes(props.plan)) {
      throw new InvalidPlanError(props.plan)
    }

    return new User(props)
  }

  static createFromPrimitives(data: {
    id: string
    name: string
    email: string
    password: string
    refreshTokenHash?: string | null
    plan: Plan
    createdAt: Date
  }): User {
    return new User(data)
  }

  isPremium(): boolean {
    return this.plan === Plan.PREMIUM
  }
}
