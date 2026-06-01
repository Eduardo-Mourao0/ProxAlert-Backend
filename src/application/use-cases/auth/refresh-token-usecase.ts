import { Inject, Injectable } from '@nestjs/common'
import { LoginUserDTO, toUserDTO } from '../../dtos/create-user.dto'
import { BusinessError } from '../../../domain/errors/business-error'
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../../domain/services/token-service'
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../domain/services/password-hasher'
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/repositories/user-repository'

export interface RefreshTokenRequest {
  refreshToken: string
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(request: RefreshTokenRequest): Promise<LoginUserDTO> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(
        request.refreshToken,
      )

      const user = await this.userRepository.findById(payload.sub)

      if (!user || !user.refreshTokenHash) {
        throw new BusinessError('Invalid refresh token', 401)
      }

      const refreshTokenMatches = await this.passwordHasher.compare(
        request.refreshToken,
        user.refreshTokenHash,
      )

      if (!refreshTokenMatches) {
        throw new BusinessError('Invalid refresh token', 401)
      }

      const accessToken = await this.tokenService.signAccessToken({
        sub: user.id,
      })
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
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error
      }

      throw new BusinessError('Invalid refresh token', 401)
    }
  }
}
