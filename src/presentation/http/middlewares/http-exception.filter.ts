import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { BusinessError } from '../../../domain/errors/business-error'
import { Logger } from '../../../infra/log/logger'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()

    const statusCode = this.getStatusCode(exception)
    await this.logException(exception, request.path)

    response.status(statusCode).json({
      statusCode,
      message: this.getMessage(exception),
      error: this.getErrorName(exception),
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(exception instanceof ZodError && {
        issues: exception.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    })
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof ZodError) {
      return HttpStatus.BAD_REQUEST
    }

    if (exception instanceof BusinessError) {
      return exception.statusCode
    }

    if (exception instanceof HttpException) {
      return exception.getStatus()
    }

    return HttpStatus.INTERNAL_SERVER_ERROR
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof ZodError) {
      return 'Dados invalidos.'
    }

    if (exception instanceof BusinessError) {
      return exception.message
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse()

      if (typeof response === 'string') {
        return response
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = response.message
        return Array.isArray(message) ? message.join(', ') : String(message)
      }

      return exception.message
    }

    return 'Internal server error'
  }

  private getErrorName(exception: unknown): string {
    if (exception instanceof ZodError) {
      return 'ValidationError'
    }

    if (exception instanceof Error) {
      return exception.name
    }

    return 'InternalServerError'
  }

  private async logException(exception: unknown, route: string): Promise<void> {
    if (exception instanceof ZodError) {
      await this.logger.warn('Dados invalidos.', route)
      return
    }

    if (exception instanceof BusinessError) {
      await this.logger.warn(exception.message, route)
      return
    }

    if (exception instanceof HttpException) {
      await this.logger.warn(this.getMessage(exception), route)
      return
    }

    await this.logger.error(exception, route)
  }
}
