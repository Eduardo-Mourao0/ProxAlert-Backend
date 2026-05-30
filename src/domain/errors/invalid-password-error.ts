import { BusinessError } from './business-error'

export class InvalidPasswordError extends BusinessError {
  constructor() {
    super(`A senha deve ter no mínimo 4 caracteres.`)
    this.name = 'InvalidPasswordError'
  }
}
