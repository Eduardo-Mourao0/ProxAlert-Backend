import { Module } from '@nestjs/common'
import { ChangeUserPasswordUseCase } from './application/use-cases/user/change-user-password-usecase'
import { CreateUserUseCase } from './application/use-cases/user/create-user-usecase'
import { DeleteUserUseCase } from './application/use-cases/user/delete-user-usecase'
import { UpdateUserProfileUseCase } from './application/use-cases/user/update-user-profile-usecase'
import { USER_REPOSITORY } from './domain/repositories/User-Repository'
import { PASSWORD_HASHER } from './domain/services/password-hasher'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { PrismaUserRepository } from './infra/repositories/prisma-user.repository'
import { BcryptPasswordHasher } from './infra/services/bcrypt-password-hasher'
import { UserController } from './presentation/http/controllers/user.controller'
import { UserService } from './presentation/http/services/user.service'

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    UserService,
    CreateUserUseCase,
    UpdateUserProfileUseCase,
    ChangeUserPasswordUseCase,
    DeleteUserUseCase,

    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },

    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
