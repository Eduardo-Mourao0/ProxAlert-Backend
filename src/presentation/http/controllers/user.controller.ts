import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { CreateUserUseCase } from '../../../application/use-cases/create-user-usecase'
import { createUserBodySchema } from '../validators/create-user.validator'

@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown) {
    const data = createUserBodySchema.parse(body)

    return this.createUserUseCase.execute(data)
  }
}
