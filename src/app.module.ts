import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { Logger } from './infra/log/logger'
import { HttpExceptionFilter } from './presentation/http/middlewares/http-exception.filter'
import { AuthModule } from './auth.module'
import { UserModule } from './user.module'

@Module({
  imports: [PrismaModule, UserModule, AuthModule],
  controllers: [],
  providers: [
    Logger,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
