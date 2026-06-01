import { USER_REPOSITORY, type UserRepository } from "../../../domain/repositories/user-repository";
import { Inject, Injectable } from "@nestjs/common";
import { BusinessError } from "../../../domain/errors/business-error";
import { toUserDTO, UserDTO } from "../../dtos/create-user.dto";

interface UpdateUserProfileRequest {
    userId: string
    name?: string
    email?: string
}

@Injectable()
export class UpdateUserProfileUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private userRepository: UserRepository
    ){}

    async execute(request: UpdateUserProfileRequest): Promise<UserDTO> {
        const user = await this.userRepository.findById(request.userId) // Busca o usuário pelo ID

        if (!user) throw new BusinessError('User not found', 404) // Valida se o usuário existe

        if (request.name) user.name = request.name // Atualiza o nome do usuário se fornecido

        if (request.email) {
            const email = request.email.trim().toLowerCase() // Normaliza o email para evitar duplicatas por diferenças de maiúsculas/minúsculas ou espaços

            const existingUser = await this.userRepository.findByEmail(email) // Busca o usuário pelo email

            if (existingUser && existingUser.id !== user.id) {
                throw new BusinessError('Email already in use', 409) // Valida se o email já está em uso por outro usuário
            }

            user.email = email // Atualiza o email do usuário se fornecido
        }

        const updatedUser = await this.userRepository.update(user) // Atualiza o usuário no repositório

        return toUserDTO(updatedUser) // Retorna o usuário atualizado como UserDTO
    }
}