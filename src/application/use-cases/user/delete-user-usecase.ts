import { USER_REPOSITORY, type UserRepository } from '../../../domain/repositories/user-repository'
import { Inject, Injectable } from '@nestjs/common'
import { BusinessError } from '../../../domain/errors/business-error'

interface DeleteUserRequest {
    userId: string
}

@Injectable()
export class DeleteUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY) 
        private readonly userRepository: UserRepository,
    ) {}

    async execute(request: DeleteUserRequest): Promise<void> {
        const user = await this.userRepository.findById(request.userId) // Busca o usuário pelo ID

        if (!user) {
            throw new BusinessError('User not found', 404) // Valida se o usuário existe
        }

        await this.userRepository.updateRefreshToken(request.userId, null)
        await this.userRepository.delete(request.userId) // Deleta o usuário do repositório
    }
}
