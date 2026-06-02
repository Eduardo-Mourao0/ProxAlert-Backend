import { UpdateUserPlanUseCase } from '../../../../../src/application/use-cases/user/update-user-plan-usecase'
import { Plan, User } from '../../../../../src/domain/entities/User'
import type { UserRepository } from '../../../../../src/domain/repositories/user-repository'

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

function makeUser(plan = Plan.FREE) {
  return User.createFromPrimitives({
    id: 'user-id',
    name: 'Eduardo',
    email: 'eduardo@email.com',
    password: 'hashed:1234',
    plan,
    createdAt: new Date(),
  })
}

describe('UpdateUserPlanUseCase', () => {
  let userRepository: FakeUserRepository
  let useCase: UpdateUserPlanUseCase

  beforeEach(() => {
    userRepository = new FakeUserRepository()
    useCase = new UpdateUserPlanUseCase(userRepository)
  })

  it('updates a free user to premium', async () => {
    userRepository.users.push(makeUser(Plan.FREE))

    const user = await useCase.execute({
      userId: 'user-id',
      plan: Plan.PREMIUM,
    })

    expect(user.plan).toBe(Plan.PREMIUM)
    expect(userRepository.users[0].plan).toBe(Plan.PREMIUM)
  })

  it('updates a premium user to free', async () => {
    userRepository.users.push(makeUser(Plan.PREMIUM))

    const user = await useCase.execute({
      userId: 'user-id',
      plan: Plan.FREE,
    })

    expect(user.plan).toBe(Plan.FREE)
    expect(userRepository.users[0].plan).toBe(Plan.FREE)
  })

  it('rejects users that are already on the requested plan', async () => {
    userRepository.users.push(makeUser(Plan.PREMIUM))

    await expect(
      useCase.execute({
        userId: 'user-id',
        plan: Plan.PREMIUM,
      }),
    ).rejects.toMatchObject({
      message: 'User is already PREMIUM',
      statusCode: 400,
    })
  })

  it('rejects unknown users', async () => {
    await expect(
      useCase.execute({
        userId: 'unknown-user',
        plan: Plan.PREMIUM,
      }),
    ).rejects.toMatchObject({
      message: 'User not found',
      statusCode: 404,
    })
  })
})
