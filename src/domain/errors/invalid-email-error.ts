import { BusinessError } from './business-error'

export class InvalidEmailError extends BusinessError {
  constructor(email: string) {
    super(`O email "${email}" é inválido.`)
    this.name = 'InvalidEmailError'
  }
}