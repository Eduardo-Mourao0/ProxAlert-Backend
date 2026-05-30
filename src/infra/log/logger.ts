import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma/prisma.service'

@Injectable()
export class Logger {
  constructor(private readonly prisma: PrismaService) {}

  async info(message: string, route?: string): Promise<void> {
    await this.createLog('INFO', message, undefined, route)
  }

  async warn(message: string, route?: string): Promise<void> {
    await this.createLog('WARN', message, undefined, route)
  }

  async error(error: unknown, route?: string): Promise<void> {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    await this.createLog('ERROR', message, stack, route)
  }

  private async createLog(
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    stack?: string,
    route?: string,
  ): Promise<void> {
    try {
      await this.prisma.log.create({
        data: {
          level,
          message,
          route,
          stack,
        },
      })
    } catch (error) {
      console.error('Falha ao registrar log:', error)
    }
  }
}
