import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfirmSubscriptionPurchaseUseCase } from './application/use-cases/subscription/confirm-subscription-purchase-usecase'
import { HandleSubscriptionStoreNotificationUseCase } from './application/use-cases/subscription/handle-subscription-store-notification-usecase'
import { SUBSCRIPTION_REPOSITORY } from './domain/repositories/subscription-repository'
import { USER_REPOSITORY } from './domain/repositories/user-repository'
import { SUBSCRIPTION_NOTIFICATION_SERVICE } from './domain/services/subscription-notification-service'
import { SUBSCRIPTION_PAYMENT_SERVICE } from './domain/services/subscription-payment-service'
import { TOKEN_SERVICE } from './domain/services/token-service'
import { TRANSACTION_MANAGER } from './domain/services/transaction-manager'
import { PrismaModule } from './infra/database/prisma/prisma.module'
import { PrismaTransactionManager } from './infra/database/prisma/prisma-transaction-manager'
import { PrismaSubscriptionRepository } from './infra/repositories/prisma-subscription.repository'
import { PrismaUserRepository } from './infra/repositories/prisma-user.repository'
import { JwtTokenService } from './infra/services/jwt-token-service'
import { AppleStoreNotificationParser } from './infra/services/subscription/apple-store-notification-parser'
import { AppleStoreSubscriptionService } from './infra/services/subscription/apple-store-subscription-service'
import { GooglePlayNotificationParser } from './infra/services/subscription/google-play-notification-parser'
import { GooglePlaySubscriptionService } from './infra/services/subscription/google-play-subscription-service'
import { StoreSubscriptionNotificationService } from './infra/services/subscription/store-subscription-notification-service'
import { StoreSubscriptionPaymentService } from './infra/services/store-subscription-payment-service'
import { SubscriptionController } from './presentation/http/controllers/subscription.controller'
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard'
import { SubscriptionService } from './presentation/http/services/subscription.service'

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    JwtAuthGuard,
    ConfirmSubscriptionPurchaseUseCase,
    HandleSubscriptionStoreNotificationUseCase,
    GooglePlaySubscriptionService,
    AppleStoreSubscriptionService,
    GooglePlayNotificationParser,
    AppleStoreNotificationParser,
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: PrismaSubscriptionRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: SUBSCRIPTION_PAYMENT_SERVICE,
      useClass: StoreSubscriptionPaymentService,
    },
    {
      provide: SUBSCRIPTION_NOTIFICATION_SERVICE,
      useClass: StoreSubscriptionNotificationService,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: PrismaTransactionManager,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
})
export class SubscriptionModule {}
