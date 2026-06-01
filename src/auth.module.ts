import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { LoginUserUseCase } from './application/use-cases/auth/login-user-usecase'
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token-usecase'
import { USER_REPOSITORY } from './domain/repositories/User-Repository'
import { PASSWORD_HASHER } from './domain/services/password-hasher'
import { TOKEN_SERVICE } from './domain/services/token-service'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { PrismaUserRepository } from './infra/repositories/prisma-user.repository'
import { BcryptPasswordHasher } from './infra/services/bcrypt-password-hasher'
import { JwtTokenService } from './infra/services/jwt-token-service'
import { AuthController } from './presentation/http/controllers/auth.controller'
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard'
import { AuthService } from './presentation/http/services/auth.service'

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    LoginUserUseCase,
    RefreshTokenUseCase,
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
  exports: [TOKEN_SERVICE, JwtAuthGuard],
})
export class AuthModule {}
