import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  INestApplication,
} from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { ZodError } from 'zod'
import { CreateAlarmUseCase } from '../../src/application/use-cases/alarm/create-alarm-usecase'
import { DeleteAlarmUseCase } from '../../src/application/use-cases/alarm/delete-alarm-usecase'
import { ListUserAlarmUseCase } from '../../src/application/use-cases/alarm/list-user-alarm-usecase'
import { ToggleAlarmStatusUseCase } from '../../src/application/use-cases/alarm/toggle-alarm-status-usecase'
import { UpdateAlarmUseCase } from '../../src/application/use-cases/alarm/update-alarm-usecase'
import { LoginUserUseCase } from '../../src/application/use-cases/auth/login-user-usecase'
import { RefreshTokenUseCase } from '../../src/application/use-cases/auth/refresh-token-usecase'
import { ChangeUserPasswordUseCase } from '../../src/application/use-cases/user/change-user-password-usecase'
import { CreateUserUseCase } from '../../src/application/use-cases/user/create-user-usecase'
import { DeleteUserUseCase } from '../../src/application/use-cases/user/delete-user-usecase'
import { UpdateUserPlanUseCase } from '../../src/application/use-cases/user/update-user-plan-usecase'
import { UpdateUserProfileUseCase } from '../../src/application/use-cases/user/update-user-profile-usecase'
import { Alarm } from '../../src/domain/entities/Alarm'
import { User } from '../../src/domain/entities/User'
import { BusinessError } from '../../src/domain/errors/business-error'
import {
  ALARM_REPOSITORY,
  type AlarmRepository,
} from '../../src/domain/repositories/alarm-repository'
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../src/domain/repositories/user-repository'
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../src/domain/services/password-hasher'
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../src/domain/services/token-service'
import { AlarmController } from '../../src/presentation/http/controllers/alarm.controller'
import { AuthController } from '../../src/presentation/http/controllers/auth.controller'
import { UserController } from '../../src/presentation/http/controllers/user.controller'
import { JwtAuthGuard } from '../../src/presentation/http/guards/jwt-auth.guard'
import { AlarmService } from '../../src/presentation/http/services/alarm.service'
import { AuthService } from '../../src/presentation/http/services/auth.service'
import { UserService } from '../../src/presentation/http/services/user.service'

class InMemoryUserRepository implements UserRepository {
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

class InMemoryAlarmRepository implements AlarmRepository {
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

class FakePasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return `hashed:${value}`
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return hash === `hashed:${value}`
  }
}

class FakeTokenService implements TokenService {
  private refreshCounter = 0

  async signAccessToken(payload: { sub: string }): Promise<string> {
    return `access:${payload.sub}`
  }

  async signRefreshToken(payload: { sub: string }): Promise<string> {
    this.refreshCounter += 1
    return `refresh:${payload.sub}:${this.refreshCounter}`
  }

  async verify(token: string): Promise<{ sub: string; tokenType: 'access' | 'refresh' }> {
    const [type, sub] = token.split(':')

    if (!sub || (type !== 'access' && type !== 'refresh')) {
      throw new Error('Invalid token')
    }

    return {
      sub,
      tokenType: type,
    }
  }

  async verifyRefreshToken(token: string): Promise<{ sub: string }> {
    const payload = await this.verify(token)

    if (payload.tokenType !== 'refresh') {
      throw new Error('Invalid refresh token')
    }

    return { sub: payload.sub }
  }
}

@Catch()
class TestHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse()
    const request = context.getRequest()
    const statusCode = this.getStatusCode(exception)

    response.status(statusCode).json({
      statusCode,
      message: this.getMessage(exception),
      error: this.getErrorName(exception),
      path: request.url,
      ...(exception instanceof ZodError && {
        issues: exception.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    })
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof ZodError) return 400
    if (exception instanceof BusinessError) return exception.statusCode
    if (exception instanceof HttpException) return exception.getStatus()
    return 500
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof ZodError) return 'Dados invalidos.'
    if (exception instanceof BusinessError) return exception.message
    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse()

      if (
        typeof httpResponse === 'object' &&
        httpResponse !== null &&
        'message' in httpResponse
      ) {
        const message = httpResponse.message
        return Array.isArray(message) ? message.join(', ') : String(message)
      }

      return exception.message
    }

    return 'Internal server error'
  }

  private getErrorName(exception: unknown): string {
    if (exception instanceof ZodError) return 'ValidationError'
    if (exception instanceof Error) return exception.name
    return 'InternalServerError'
  }
}

describe('ProxAlert HTTP API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController, AuthController, AlarmController],
      providers: [
        UserService,
        AuthService,
        AlarmService,
        JwtAuthGuard,
        CreateUserUseCase,
        UpdateUserProfileUseCase,
        UpdateUserPlanUseCase,
        ChangeUserPasswordUseCase,
        DeleteUserUseCase,
        LoginUserUseCase,
        RefreshTokenUseCase,
        CreateAlarmUseCase,
        ListUserAlarmUseCase,
        UpdateAlarmUseCase,
        DeleteAlarmUseCase,
        ToggleAlarmStatusUseCase,
        {
          provide: USER_REPOSITORY,
          useClass: InMemoryUserRepository,
        },
        {
          provide: ALARM_REPOSITORY,
          useClass: InMemoryAlarmRepository,
        },
        {
          provide: PASSWORD_HASHER,
          useClass: FakePasswordHasher,
        },
        {
          provide: TOKEN_SERVICE,
          useClass: FakeTokenService,
        },
        {
          provide: APP_FILTER,
          useClass: TestHttpExceptionFilter,
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app?.close()
  })

  async function createUserAndLogin() {
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Eduardo',
        email: 'eduardo@email.com',
        password: '1234',
        confirmpassword: '1234',
      })

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'eduardo@email.com',
        password: '1234',
      })

    return {
      user: userResponse.body,
      accessToken: loginResponse.body.accessToken as string,
      refreshToken: loginResponse.body.refreshToken as string,
    }
  }

  it('creates a user without exposing the password', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Eduardo',
        email: 'EDUARDO@EMAIL.COM',
        password: '1234',
        confirmpassword: '1234',
      })
      .expect(201)

    expect(response.body).toMatchObject({
      name: 'Eduardo',
      email: 'eduardo@email.com',
      plan: 'FREE',
    })
    expect(response.body.password).toBeUndefined()
  })

  it('returns validation errors for invalid user payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: '',
        email: 'invalid-email',
        password: '1234',
        confirmpassword: '4321',
      })
      .expect(400)

    expect(response.body.error).toBe('ValidationError')
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'email' }),
        expect.objectContaining({ path: 'confirmpassword' }),
      ]),
    )
  })

  it('logs in and refreshes tokens', async () => {
    const { refreshToken } = await createUserAndLogin()

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200)

    expect(response.body.accessToken).toEqual(expect.any(String))
    expect(response.body.refreshToken).toEqual(expect.any(String))
    expect(response.body.user.email).toBe('eduardo@email.com')
  })

  it('blocks protected alarm routes without an access token', async () => {
    const response = await request(app.getHttpServer()).get('/alarms').expect(401)

    expect(response.body.message).toBe('Missing authentication token')
  })

  it('creates, lists, toggles and deletes alarms for the authenticated user', async () => {
    const { accessToken } = await createUserAndLogin()

    const createResponse = await request(app.getHttpServer())
      .post('/alarms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Casa',
        description: 'Voce esta chegando.',
        address: 'Av. Paulista, 1000 - Sao Paulo',
        latitude: -23.5505,
        longitude: -46.6333,
        radius: 500,
      })
      .expect(201)

    expect(createResponse.body).toMatchObject({
      title: 'Casa',
      description: 'Voce esta chegando.',
      address: 'Av. Paulista, 1000 - Sao Paulo',
      isActive: true,
      radius: 500,
    })

    const listResponse = await request(app.getHttpServer())
      .get('/alarms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(listResponse.body).toHaveLength(1)

    const alarmId = createResponse.body.id as string

    const toggleResponse = await request(app.getHttpServer())
      .patch(`/alarms/${alarmId}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(toggleResponse.body.isActive).toBe(false)

    await request(app.getHttpServer())
      .delete(`/alarms/${alarmId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    const emptyListResponse = await request(app.getHttpServer())
      .get('/alarms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(emptyListResponse.body).toEqual([])
  })

  it('enforces the free plan limit of 3 saved alarms', async () => {
    const { accessToken } = await createUserAndLogin()

    for (const title of ['Casa', 'Trabalho', 'Faculdade']) {
      await request(app.getHttpServer())
        .post('/alarms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title,
          description: null,
          latitude: -23.5505,
          longitude: -46.6333,
          radius: 500,
        })
        .expect(201)
    }

    const response = await request(app.getHttpServer())
      .post('/alarms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Academia',
        description: null,
        latitude: -23.5505,
        longitude: -46.6333,
        radius: 500,
      })
      .expect(403)

    expect(response.body.message).toBe('Free users can create up to 3 alarms.')
  })

  it('updates the authenticated user plan to premium', async () => {
    const { accessToken } = await createUserAndLogin()

    const response = await request(app.getHttpServer())
      .patch('/users/me/plan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plan: 'PREMIUM' })
      .expect(200)

    expect(response.body.plan).toBe('PREMIUM')
  })

  it('allows premium users to create more than 3 alarms', async () => {
    const { accessToken } = await createUserAndLogin()

    await request(app.getHttpServer())
      .patch('/users/me/plan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plan: 'PREMIUM' })
      .expect(200)

    for (const title of ['Casa', 'Trabalho', 'Faculdade', 'Academia']) {
      await request(app.getHttpServer())
        .post('/alarms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title,
          description: null,
          latitude: -23.5505,
          longitude: -46.6333,
          radius: 500,
        })
        .expect(201)
    }

    const response = await request(app.getHttpServer())
      .get('/alarms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(response.body).toHaveLength(4)
  })
})
