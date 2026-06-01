import { v4 as uuidv4 } from 'uuid'
import { InvalidEmailError } from '../errors/invalid-email-error'
import { InvalidNameError } from '../errors/invalid-name-error'
import { InvalidPlanError } from '../errors/invalid-plan-error'
import { InvalidPasswordError } from '../errors/invalid-password-error'

export enum Plan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
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
    this.id = props.id ?? uuidv4()
    this.name = props.name.trim()
    this.email = props.email.trim().toLowerCase()
    this.password = props.password
    this.refreshTokenHash = props.refreshTokenHash ?? null
    this.plan = props.plan ?? Plan.FREE
    this.createdAt = props.createdAt ?? new Date()
  }

  static create(props: UserProps): User { // Cria um usuário a partir de propriedades
    
    if (!props.name || props.name.trim().length === 0) { // Valida se o nome não está vazio ou apenas com espaços
      throw new InvalidNameError();
    }
    if (!props.password || props.password.trim().length < 4) { // Valida se a senha tem pelo menos 4 caracteres
      throw new InvalidPasswordError();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/   
    if (!props.email || !emailRegex.test(props.email)) { // Valida se o email é válido usando uma expressão regular simples
      throw new InvalidEmailError(props.email);
    }
    if (props.plan && !Object.values(Plan).includes(props.plan)) { // Valida se o plano é valido
      throw new InvalidPlanError(props.plan)
    }

    return new User(props)
  }

  static createFromPrimitives(data: { // Cria um usuário a partir de dados primitivos
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

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      plan: this.plan,
      createdAt: this.createdAt,
    }
  }
}
