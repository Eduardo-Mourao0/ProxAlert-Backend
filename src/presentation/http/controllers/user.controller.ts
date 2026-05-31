import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { createUserBodySchema, upgradeUserBodySchema, deleteUserBodySchema } from '../validators/user.validator'
import { UserService } from '../services/user.service'

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
  @HttpCode(200)
  async update(@Body() body: unknown) {
    const data = deleteUserBodySchema.parse(body)

    return this.userService.updateProfile(data)
  }

  @Post('/delete')
  @HttpCode(200)
  async delete(@Body() body: unknown) {
    const data = upgradeUserBodySchema.parse(body)

    return this.userService.delete(data)
  }
}
