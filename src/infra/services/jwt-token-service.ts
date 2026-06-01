import { Injectable } from '@nestjs/common'
import { JwtService, type JwtSignOptions } from '@nestjs/jwt'
import { TokenService } from '../../domain/services/token-service'

interface JwtPayload {
  sub: string
  tokenType?: 'access' | 'refresh'
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.sign({ ...payload, tokenType: 'access' }, '30m')
  }

  async signRefreshToken(payload: JwtPayload): Promise<string> {
    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ??
      '30d') as JwtSignOptions['expiresIn']

    return this.sign({ ...payload, tokenType: 'refresh' }, expiresIn)
  }

  async verify(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: process.env.JWT_SECRET,
    })
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const payload = await this.verify(token)

    if (payload.tokenType !== 'refresh') {
      throw new Error('Invalid refresh token')
    }

    return payload
  }

  private async sign(
    payload: JwtPayload,
    expiresIn: JwtSignOptions['expiresIn'],
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn,
    })
  }
}
