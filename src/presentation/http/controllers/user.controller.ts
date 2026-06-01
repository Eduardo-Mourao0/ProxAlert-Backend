import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { createUserBodySchema, upgradeUserBodySchema, changeUserPasswordBodySchema } from '../validators/user.validator'
import { UserService } from '../services/user.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/create')
  @HttpCode(201)
  async create(@Body() body: unknown) {
    const data = createUserBodySchema.parse(body)

    return this.userService.create(data)
  }

  @Post('/upgrade')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async update(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = upgradeUserBodySchema.parse(body)

    return this.userService.updateProfile({
      ...data,
      userId: request.user.id,
    })
  }

  @Post('/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async changePassword(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = changeUserPasswordBodySchema.parse(body)

    return this.userService.changePassword({
      ...data,
      userId: request.user.id,
    })
  }

  @Post('/delete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async delete(@Req() request: AuthenticatedRequest) {
    return this.userService.delete({
      userId: request.user.id,
    })
  }
}
