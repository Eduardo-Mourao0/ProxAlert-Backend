import { Injectable } from '@nestjs/common'
import { TransactionManager } from '../../../domain/services/transaction-manager'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction((transactionClient) =>
      this.prisma.runWithTransaction(transactionClient, callback),
    )
  }
}
