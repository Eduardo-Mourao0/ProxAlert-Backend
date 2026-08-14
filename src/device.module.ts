import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { DeactivateDeviceUseCase } from './application/use-cases/device/deactivate-device-usecase'
import { ListUserDevicesUseCase } from './application/use-cases/device/list-user-devices-usecase'
import { RegisterDeviceUseCase } from './application/use-cases/device/register-device-usecase'
import { DEVICE_REPOSITORY } from './domain/repositories/device-repository'
import { TOKEN_SERVICE } from './domain/services/token-service'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { PrismaDeviceRepository } from './infra/repositories/prisma-device.repository'
import { JwtTokenService } from './infra/services/jwt-token-service'
import { DeviceController } from './presentation/http/controllers/device.controller'
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard'
import { DeviceService } from './presentation/http/services/device.service'

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [DeviceController],
  providers: [
    DeviceService,
    JwtAuthGuard,
    RegisterDeviceUseCase,
    ListUserDevicesUseCase,
    DeactivateDeviceUseCase,
    {
      provide: DEVICE_REPOSITORY,
      useClass: PrismaDeviceRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
})
export class DeviceModule {}
