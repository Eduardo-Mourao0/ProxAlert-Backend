import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { authBodySchema, refreshTokenBodySchema } from '../validators/auth.validator'
import { AuthService } from '../services/auth.service'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/login')
    @HttpCode(200)
    login(@Body() body: unknown) {
        const data = authBodySchema.parse(body)

        return this.authService.login(data)
    }

    @Post('/refresh')
    @HttpCode(200)
    refresh(@Body() body: unknown) {
        const data = refreshTokenBodySchema.parse(body)

        return this.authService.refresh(data)
    }
}
