import { USER_REPOSITORY, type UserRepository } from "../../../domain/repositories/User-Repository";
import { BusinessError } from "../../../domain/errors/business-error";
import { Inject, Injectable } from "@nestjs/common";
import { toUserDTO, UserDTO } from "../../dtos/create-user.dto";
import { PASSWORD_HASHER, type PasswordHasher } from "../../../domain/services/password-hasher";

interface ChangeUserPasswordRequest {
    userId: string;
    password: string;
    confirmpassword: string
}   

@Injectable()
export class ChangeUserPasswordUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private userRepository: UserRepository,
        @Inject(PASSWORD_HASHER)
        private passwordHasher: PasswordHasher
    ) {}

    async execute(request: ChangeUserPasswordRequest): Promise<UserDTO> {
        const user = await this.userRepository.findById(request.userId)

        if (!user) throw new BusinessError('User not found', 404) // Valida se o usuário existe

        if( request.password !== request.confirmpassword) {
            throw new BusinessError('Passwords do not match', 400) // Valida se as senhas coincidem
        }

        const hashedPassword = await this.passwordHasher.hash(request.password) // Hash da senha

        user.password = hashedPassword // Atualiza a senha

        const updatedUser = await this.userRepository.update(user) // Atualiza o usuário no repositório

        return toUserDTO(updatedUser) // Retorna o usuário atualizado como UserDTO
    }
}