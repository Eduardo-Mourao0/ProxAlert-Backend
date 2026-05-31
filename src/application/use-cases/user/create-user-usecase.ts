import { Inject, Injectable } from "@nestjs/common"
import { Plan, User } from "../../../domain/entities/User"
import { USER_REPOSITORY, type UserRepository } from "../../../domain/repositories/User-Repository"
import { BusinessError } from "../../../domain/errors/business-error"
import { InvalidPasswordError } from "../../../domain/errors/invalid-password-error"
import { toUserDTO, UserDTO } from "../../dtos/create-user.dto"
import { PASSWORD_HASHER, type PasswordHasher } from "../../../domain/services/password-hasher"

export interface CreateUserRequest { 
    name: string
    email: string
    password: string
    confirmpassword: string
    plan?: Plan
} 

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private userRepository: UserRepository, 
        @Inject(PASSWORD_HASHER)
        private passwordHasher: PasswordHasher
    ){}

    async execute(request: CreateUserRequest): Promise<UserDTO> {
        
        const email = request.email.trim().toLowerCase() // Normaliza o email para evitar duplicatas por diferenças de maiúsculas/minúsculas ou espaços

        const existingUser = await this.userRepository.findByEmail(email) // Busca o usuário pelo email

        if (existingUser) throw new BusinessError('Email already in use', 409) // Valida se o email já está em uso

        if (!request.password || request.password.trim().length < 4) {
            throw new InvalidPasswordError(); // Valida se a senha tem pelo menos 4 caracteres
        }

        if (request.password !== request.confirmpassword) {
            throw new BusinessError('Passwords do not match', 400); // Valida se as senhas coincidem
        }

        const hashedPassword = await this.passwordHasher.hash(request.password) // Hash da senha antes de criar o usuário

        const user = User.create({
            name: request.name,
            email: email,
            password: hashedPassword,
            plan: request.plan
        }) // Cria o usuário usando a entidade User

        const createdUser = await this.userRepository.create(user) // Salva o usuário no repositório

        return toUserDTO(createdUser); // Retorna o usuário criado como UserDTO
    }
}
