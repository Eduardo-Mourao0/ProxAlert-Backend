import { Injectable } from '@nestjs/common'
import { CreateUserRequest, CreateUserUseCase } from '../../../application/use-cases/user/create-user-usecase'
import { ChangeUserPasswordRequest, ChangeUserPasswordUseCase } from '../../../application/use-cases/user/change-user-password-usecase'
import { DeleteUserRequest, DeleteUserUseCase } from '../../../application/use-cases/user/delete-user-usecase'
import { UpdateUserProfileRequest, UpdateUserProfileUseCase } from '../../../application/use-cases/user/update-user-profile-usecase'

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

  updateProfile(data: UpdateUserProfileRequest) {
    return this.updateUserProfileUseCase.execute(data)
  }

  changePassword(data: ChangeUserPasswordRequest) {
    return this.changeUserPasswordUseCase.execute(data)
  }

  delete(data: DeleteUserRequest) {
    return this.deleteUserUseCase.execute(data)
  }
}
