import { Injectable } from '@nestjs/common'
import {
  LoginUserRequest,
  LoginUserUseCase,
} from '../../../application/use-cases/auth/login-user-usecase'
import {
  RefreshTokenRequest,
  RefreshTokenUseCase,
} from '../../../application/use-cases/auth/refresh-token-usecase'

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  login(data: LoginUserRequest) {
    return this.loginUserUseCase.execute(data)
  }

  refresh(data: RefreshTokenRequest) {
    return this.refreshTokenUseCase.execute(data)
  }
}
