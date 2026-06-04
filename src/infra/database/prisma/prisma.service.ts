import { Injectable, OnModuleInit } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'
import { PrismaClient } from '../../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly transactionStorage = new AsyncLocalStorage<any>()

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    })

    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  get client(): any {
    return this.transactionStorage.getStore() ?? this
  }

  runWithTransaction<T>(transactionClient: any, callback: () => Promise<T>): Promise<T> {
    return this.transactionStorage.run(transactionClient, callback)
  }
}
