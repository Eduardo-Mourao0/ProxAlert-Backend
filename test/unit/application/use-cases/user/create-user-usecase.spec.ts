import { CreateUserUseCase } from '../../../../../src/application/use-cases/user/create-user-usecase'
import { User } from '../../../../../src/domain/entities/User'
import { BusinessError } from '../../../../../src/domain/errors/business-error'
import type { UserRepository } from '../../../../../src/domain/repositories/user-repository'
import type { PasswordHasher } from '../../../../../src/domain/services/password-hasher'

class FakeUserRepository implements UserRepository {
  users: User[] = []

  async create(user: User): Promise<User> {
    this.users.push(user)
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null
  }

  async update(user: User): Promise<User> {
    this.users = this.users.map((currentUser) =>
      currentUser.id === user.id ? user : currentUser,
    )
    return user
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    const user = await this.findById(userId)
    if (user) user.refreshTokenHash = refreshTokenHash
  }

  async findAll(): Promise<User[]> {
    return this.users
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id)
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`
  }
}

describe('CreateUserUseCase', () => {
  let userRepository: FakeUserRepository
  let useCase: CreateUserUseCase

  beforeEach(() => {
    userRepository = new FakeUserRepository()
    useCase = new CreateUserUseCase(userRepository, new FakePasswordHasher())
  })

  it('creates a user with hashed password and normalized email', async () => {
    const user = await useCase.execute({
      name: 'Eduardo',
      email: ' EDUARDO@EMAIL.COM ',
      password: '1234',
      confirmpassword: '1234',
    })

    expect(user.email).toBe('eduardo@email.com')
    expect(user).not.toHaveProperty('password')
    expect(userRepository.users[0].password).toBe('hashed:1234')
  })

  it('rejects duplicated emails', async () => {
    userRepository.users.push(
      User.create({
        name: 'Eduardo',
        email: 'eduardo@email.com',
        password: 'hashed:1234',
      }),
    )

    await expect(
      useCase.execute({
        name: 'Eduardo',
        email: 'EDUARDO@EMAIL.COM',
        password: '1234',
        confirmpassword: '1234',
      }),
    ).rejects.toMatchObject({
      message: 'Email already in use',
      statusCode: 409,
    })
  })

  it('rejects different password confirmation', async () => {
    await expect(
      useCase.execute({
        name: 'Eduardo',
        email: 'eduardo@email.com',
        password: '1234',
        confirmpassword: '4321',
      }),
    ).rejects.toBeInstanceOf(BusinessError)
  })
})
