import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../../domain/services/token-service'

export interface AuthenticatedRequest extends Request {
  user: {
    id: string
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractBearerToken(request)

    if (!token) {
      throw new UnauthorizedException('Missing authentication token')
    }

    try {
      const payload = await this.tokenService.verify(token)

      if (!payload.sub || payload.tokenType !== 'access') {
        throw new UnauthorizedException('Invalid authentication token')
      }

      request.user = { id: payload.sub }

      return true
    } catch {
      throw new UnauthorizedException('Invalid authentication token')
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization

    if (!authorization) {
      return null
    }

    const [type, token] = authorization.split(' ')

    if (type !== 'Bearer' || !token) {
      return null
    }

    return token
  }
}
