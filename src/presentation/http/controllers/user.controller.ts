import { Body, Controller, Delete, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { createUserBodySchema, upgradeUserBodySchema, changeUserPasswordBodySchema, deleteUserBodySchema, updateUserPlanBodySchema } from '../validators/user.validator'
import { UserService } from '../services/user.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown) {
    const data = createUserBodySchema.parse(body)

    return this.userService.create(data)
  }

  @Patch('/me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async update(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = upgradeUserBodySchema.parse(body)

    return this.userService.updateProfile({
      ...data,
      userId: request.user.id,
    })
  }

  @Patch('/me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async changePassword(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = changeUserPasswordBodySchema.parse(body)

    return this.userService.changePassword({
      ...data,
      userId: request.user.id,
    })
  }

  @Delete('/me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async delete(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    deleteUserBodySchema.parse(body)

    return this.userService.delete({
      userId: request.user.id,
    })
  }

  @Patch('/me/plan')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async updatePlan(@Body() body: unknown, @Req() request: AuthenticatedRequest ) {
    const data = updateUserPlanBodySchema.parse(body)

    return this.userService.updatePlan({
      userId: request.user.id,
      plan: data.plan,
    })
  }
}
