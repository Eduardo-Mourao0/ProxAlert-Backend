import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ChangeUserPasswordUseCase } from './application/use-cases/user/change-user-password-usecase'
import { CreateUserUseCase } from './application/use-cases/user/create-user-usecase'
import { DeleteUserUseCase } from './application/use-cases/user/delete-user-usecase'
import { UpdateUserProfileUseCase } from './application/use-cases/user/update-user-profile-usecase'
import { USER_REPOSITORY } from './domain/repositories/user-repository'
import { PASSWORD_HASHER } from './domain/services/password-hasher'
import { TOKEN_SERVICE } from './domain/services/token-service'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { PrismaUserRepository } from './infra/repositories/prisma-user.repository'
import { BcryptPasswordHasher } from './infra/services/bcrypt-password-hasher'
import { JwtTokenService } from './infra/services/jwt-token-service'
import { UserController } from './presentation/http/controllers/user.controller'
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard'
import { UserService } from './presentation/http/services/user.service'

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [UserController],
  providers: [
    UserService,
    JwtAuthGuard,
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
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
