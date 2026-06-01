import { USER_REPOSITORY, type UserRepository } from "../../../domain/repositories/User-Repository";
import { BusinessError } from "../../../domain/errors/business-error";
import { Inject, Injectable } from "@nestjs/common";
import { toUserDTO, UserDTO } from "../../dtos/create-user.dto";
import { PASSWORD_HASHER, type PasswordHasher } from "../../../domain/services/password-hasher";

interface ChangeUserPasswordRequest {
    userId: string;
    currentPassword: string;
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

        const passwordMatches = await this.passwordHasher.compare(request.currentPassword, user.password)

        if (!passwordMatches) throw new BusinessError('Invalid credentials', 401) // Valida se a senha atual é valida

        if( request.password !== request.confirmpassword) {
            throw new BusinessError('Passwords do not match', 400) // Valida se as senhas coincidem
        }

        const hashedPassword = await this.passwordHasher.hash(request.password) // Hash da senha

        user.password = hashedPassword // Atualiza a senha
        user.refreshTokenHash = null

        const updatedUser = await this.userRepository.update(user) // Atualiza o usuário no repositório

        return toUserDTO(updatedUser) // Retorna o usuário atualizado como UserDTO
    }
}
