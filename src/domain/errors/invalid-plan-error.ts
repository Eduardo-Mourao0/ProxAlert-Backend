import { BusinessError } from "./business-error";

export class InvalidPlanError extends BusinessError {
    constructor(plan: string) {
        super(`O plano "${plan}" é inválido.`)
        this.name = 'InvalidPlanError'
    }
}