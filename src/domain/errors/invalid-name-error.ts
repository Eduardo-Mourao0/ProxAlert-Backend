import { BusinessError } from './business-error'

export class InvalidNameError extends BusinessError {
  constructor() {
    super(`O nome é inválido. Não pode estar vazio.`)
    this.name = 'InvalidNameError'
  }
}
