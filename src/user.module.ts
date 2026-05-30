import { Module } from '@nestjs/common'
import { CreateUserUseCase } from './application/use-cases/create-user-usecase'
import { USER_REPOSITORY } from './domain/repositories/User-Repository'
import { PASSWORD_HASHER } from './domain/services/password-hasher'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { PrismaUserRepository } from './infra/repositories/prisma-user.repository'
import { BcryptPasswordHasher } from './infra/services/bcrypt-password-hasher'
import { UserController } from './presentation/http/controllers/user.controller'

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,

    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },

    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [CreateUserUseCase],
})
export class UserModule {}
