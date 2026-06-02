import { Inject, Injectable } from "@nestjs/common"
import { USER_REPOSITORY, type UserRepository } from "../../../domain/repositories/user-repository"
import { BusinessError } from "../../../domain/errors/business-error"
import { toUserDTO, UserDTO } from "../../dtos/create-user.dto"
import { Plan } from "../../../domain/entities/User"

export interface UpdateUserPlanRequest {
    userId: string
    plan: Plan
}

@Injectable()
export class UpdateUserPlanUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private userRepository: UserRepository, 
    ){}

    async execute(request: UpdateUserPlanRequest): Promise<UserDTO> {
        const user = await this.userRepository.findById(request.userId) // Busca o usuário pelo ID

        if (!user) throw new BusinessError('User not found', 404) // Valida se o usuário existe

        if (user.plan === request.plan) throw new BusinessError(`User is already ${request.plan}`, 400) // Valida se o usuário já está no plano solicitado

        if (request.plan === Plan.PREMIUM) {
            user.upgradeToPremium()
        }

        if (request.plan === Plan.FREE) {
            user.downgradeToFree()
        }

        const updatedUser = await this.userRepository.update(user) // Atualiza o usuário no repositório

        return toUserDTO(updatedUser) // Retorna o usuário atualizado como UserDTO
    }
}
