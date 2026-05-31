import { Injectable } from '@nestjs/common'
import {
  CreateUserRequest,
  CreateUserUseCase,
} from '../../../application/use-cases/user/create-user-usecase'
import { ChangeUserPasswordUseCase } from '../../../application/use-cases/user/change-user-password-usecase'
import { DeleteUserUseCase } from '../../../application/use-cases/user/delete-user-usecase'
import { UpdateUserProfileUseCase } from '../../../application/use-cases/user/update-user-profile-usecase'

@Injectable()
export class UserService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly changeUserPasswordUseCase: ChangeUserPasswordUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  create(data: CreateUserRequest) {
    return this.createUserUseCase.execute(data)
  }

  updateProfile(data: Parameters<UpdateUserProfileUseCase['execute']>[0]) {
    return this.updateUserProfileUseCase.execute(data)
  }

  changePassword(data: Parameters<ChangeUserPasswordUseCase['execute']>[0]) {
    return this.changeUserPasswordUseCase.execute(data)
  }

  delete(data: Parameters<DeleteUserUseCase['execute']>[0]) {
    return this.deleteUserUseCase.execute(data)
  }
}
