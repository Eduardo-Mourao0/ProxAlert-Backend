import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { DeviceService } from '../services/device.service'
import {
  deviceParamsSchema,
  registerDeviceBodySchema,
} from '../validators/device.validator'

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @HttpCode(201)
  register(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = registerDeviceBodySchema.parse(body)

    return this.deviceService.register({
      userId: request.user.id,
      pushToken: data.pushToken,
      platform: data.platform,
    })
  }

  @Get()
  @HttpCode(200)
  list(@Req() request: AuthenticatedRequest) {
    return this.deviceService.listByUser({
      userId: request.user.id,
    })
  }

  @Delete(':deviceId')
  @HttpCode(200)
  deactivate(@Param() params: unknown, @Req() request: AuthenticatedRequest) {
    const { deviceId } = deviceParamsSchema.parse(params)

    return this.deviceService.deactivate({
      userId: request.user.id,
      deviceId,
    })
  }
}
