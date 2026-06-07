import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import {
  alarmParamsSchema,
  checkAlarmProximityBodySchema,
  createAlarmBodySchema,
  updateAlarmBodySchema,
} from '../validators/alarm.validator'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard'
import { AlarmService } from '../services/alarm.service'

@Controller('alarms')
@UseGuards(JwtAuthGuard)
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = createAlarmBodySchema.parse(body)

    return this.alarmService.create({
      userId: request.user.id,
      title: data.title,
      description: data.description ?? null,
      address: data.address ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius,
    })
  }

  @Get()
  @HttpCode(200)
  list(@Req() request: AuthenticatedRequest) {
    return this.alarmService.listByUser({
      userId: request.user.id,
    })
  }

  @Post('check-proximity')
  @HttpCode(200)
  checkProximity(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const data = checkAlarmProximityBodySchema.parse(body)

    return this.alarmService.checkProximity({
      userId: request.user.id,
      latitude: data.latitude,
      longitude: data.longitude,
    })
  }

  @Patch(':alarmId')
  @HttpCode(200)
  update(
    @Param() params: unknown,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const { alarmId } = alarmParamsSchema.parse(params)
    const data = updateAlarmBodySchema.parse(body)

    return this.alarmService.update({
      ...data,
      alarmId,
      userId: request.user.id,
    })
  }

  @Patch(':alarmId/toggle')
  @HttpCode(200)
  toggle(@Param() params: unknown, @Req() request: AuthenticatedRequest) {
    const { alarmId } = alarmParamsSchema.parse(params)

    return this.alarmService.toggleStatus({
      alarmId,
      userId: request.user.id,
    })
  }

  @Delete(':alarmId')
  @HttpCode(200)
  delete(@Param() params: unknown, @Req() request: AuthenticatedRequest) {
    const { alarmId } = alarmParamsSchema.parse(params)

    return this.alarmService.delete({
      alarmId,
      userId: request.user.id,
    })
  }
}
