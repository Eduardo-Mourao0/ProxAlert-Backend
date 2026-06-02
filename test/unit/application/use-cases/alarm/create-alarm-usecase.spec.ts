import { CreateAlarmUseCase } from '../../../../../src/application/use-cases/alarm/create-alarm-usecase'
import { Alarm } from '../../../../../src/domain/entities/Alarm'
import { Plan, User } from '../../../../../src/domain/entities/User'
import { FreeAlarmLimitReachedError } from '../../../../../src/domain/errors/free-alarm-limit-reached-error'
import type { AlarmRepository } from '../../../../../src/domain/repositories/alarm-repository'
import type { UserRepository } from '../../../../../src/domain/repositories/user-repository'

class FakeAlarmRepository implements AlarmRepository {
  alarms: Alarm[] = []

  async create(alarm: Alarm): Promise<Alarm> {
    this.alarms.push(alarm)
    return alarm
  }

  async findById(id: string): Promise<Alarm | null> {
    return this.alarms.find((alarm) => alarm.id === id) ?? null
  }

  async findByUserId(userId: string): Promise<Alarm[]> {
    return this.alarms.filter((alarm) => alarm.userId === userId)
  }

  async countByUserId(userId: string): Promise<number> {
    return this.alarms.filter((alarm) => alarm.userId === userId).length
  }

  async update(alarm: Alarm): Promise<Alarm> {
    this.alarms = this.alarms.map((currentAlarm) =>
      currentAlarm.id === alarm.id ? alarm : currentAlarm,
    )
    return alarm
  }

  async delete(id: string): Promise<void> {
    this.alarms = this.alarms.filter((alarm) => alarm.id !== id)
  }
}

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
    return user
  }

  async updateRefreshToken(): Promise<void> {}

  async findAll(): Promise<User[]> {
    return this.users
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id)
  }
}

function makeUser(plan = Plan.FREE) {
  return User.createFromPrimitives({
    id: `user-${plan}`,
    name: 'Eduardo',
    email: `${plan.toLowerCase()}@email.com`,
    password: 'hashed:1234',
    plan,
    createdAt: new Date(),
  })
}

function makeAlarm(userId: string, title = 'Casa') {
  return Alarm.create({
    userId,
    title,
    description: null,
    latitude: -23.5505,
    longitude: -46.6333,
    radius: 500,
  })
}

describe('CreateAlarmUseCase', () => {
  let alarmRepository: FakeAlarmRepository
  let userRepository: FakeUserRepository
  let useCase: CreateAlarmUseCase

  beforeEach(() => {
    alarmRepository = new FakeAlarmRepository()
    userRepository = new FakeUserRepository()
    useCase = new CreateAlarmUseCase(alarmRepository, userRepository)
  })

  it('creates an alarm for an existing user', async () => {
    const user = makeUser()
    userRepository.users.push(user)

    const alarm = await useCase.execute({
      userId: user.id,
      title: 'Casa',
      description: 'Chegando em casa',
      address: 'Av. Paulista, 1000 - Sao Paulo',
      latitude: -23.5505,
      longitude: -46.6333,
      radius: 500,
    })

    expect(alarm.title).toBe('Casa')
    expect(alarm.address).toBe('Av. Paulista, 1000 - Sao Paulo')
    expect(alarm.userId).toBe(user.id)
    expect(alarmRepository.alarms).toHaveLength(1)
  })

  it('blocks a free user after 3 saved alarms', async () => {
    const user = makeUser(Plan.FREE)
    userRepository.users.push(user)
    alarmRepository.alarms.push(
      makeAlarm(user.id, 'Casa'),
      makeAlarm(user.id, 'Trabalho'),
      makeAlarm(user.id, 'Faculdade'),
    )

    await expect(
      useCase.execute({
        userId: user.id,
        title: 'Academia',
        description: null,
        latitude: -23.5505,
        longitude: -46.6333,
        radius: 500,
      }),
    ).rejects.toBeInstanceOf(FreeAlarmLimitReachedError)
  })

  it('allows premium users to create more than 3 alarms', async () => {
    const user = makeUser(Plan.PREMIUM)
    userRepository.users.push(user)
    alarmRepository.alarms.push(
      makeAlarm(user.id, 'Casa'),
      makeAlarm(user.id, 'Trabalho'),
      makeAlarm(user.id, 'Faculdade'),
    )

    await expect(
      useCase.execute({
        userId: user.id,
        title: 'Academia',
        description: null,
        latitude: -23.5505,
        longitude: -46.6333,
        radius: 500,
      }),
    ).resolves.toMatchObject({
      title: 'Academia',
    })
  })

  it('rejects unknown users', async () => {
    await expect(
      useCase.execute({
        userId: 'unknown-user',
        title: 'Casa',
        description: null,
        latitude: -23.5505,
        longitude: -46.6333,
        radius: 500,
      }),
    ).rejects.toMatchObject({
      message: 'User not found.',
      statusCode: 404,
    })
  })
})
