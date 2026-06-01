import { Inject, Injectable } from '@nestjs/common'
import { toUserDTO, LoginUserDTO } from '../../dtos/create-user.dto'
import { BusinessError } from '../../../domain/errors/business-error'
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../domain/services/password-hasher'
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../../domain/services/token-service'
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/repositories/user-repository'

export interface LoginUserRequest {
  email: string
  password: string
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserDTO> {
    const email = request.email.trim().toLowerCase()

    const user = await this.userRepository.findByEmail(email)

    if (!user) throw new BusinessError('Invalid credentials', 401)

    const passwordMatches = await this.passwordHasher.compare(
      request.password,
      user.password,
    )

    if (!passwordMatches) throw new BusinessError('Invalid credentials', 401)

    const accessToken = await this.tokenService.signAccessToken({ sub: user.id })
    const refreshToken = await this.tokenService.signRefreshToken({
      sub: user.id,
    })
    const refreshTokenHash = await this.passwordHasher.hash(refreshToken)

    await this.userRepository.updateRefreshToken(user.id, refreshTokenHash)

    return {
      accessToken,
      refreshToken,
      user: toUserDTO(user),
    }
  }
}
