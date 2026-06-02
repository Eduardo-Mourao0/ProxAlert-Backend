import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { CreateAlarmUseCase } from './application/use-cases/alarm/create-alarm-usecase'
import { DeleteAlarmUseCase } from './application/use-cases/alarm/delete-alarm-usecase'
import { ListUserAlarmUseCase } from './application/use-cases/alarm/list-user-alarm-usecase'
import { ToggleAlarmStatusUseCase } from './application/use-cases/alarm/toggle-alarm-status-usecase'
import { UpdateAlarmUseCase } from './application/use-cases/alarm/update-alarm-usecase'
import { ALARM_REPOSITORY } from './domain/repositories/alarm-repository'
import { USER_REPOSITORY } from './domain/repositories/user-repository'
import { TOKEN_SERVICE } from './domain/services/token-service'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { PrismaAlarmRepository } from './infra/repositories/prisma-alarm.repository'
import { PrismaUserRepository } from './infra/repositories/prisma-user.repository'
import { JwtTokenService } from './infra/services/jwt-token-service'
import { AlarmController } from './presentation/http/controllers/alarm.controller'
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard'
import { AlarmService } from './presentation/http/services/alarm.service'

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AlarmController],
  providers: [
    AlarmService,
    JwtAuthGuard,
    CreateAlarmUseCase,
    ListUserAlarmUseCase,
    UpdateAlarmUseCase,
    DeleteAlarmUseCase,
    ToggleAlarmStatusUseCase,
    {
      provide: ALARM_REPOSITORY,
      useClass: PrismaAlarmRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
})
export class AlarmModule {}
