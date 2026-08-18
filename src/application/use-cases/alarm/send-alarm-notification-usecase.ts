import { Inject, Injectable } from '@nestjs/common'
import {
  DEVICE_REPOSITORY,
  type DeviceRepository,
} from '../../../domain/repositories/device-repository'
import {
  PUSH_NOTIFICATION_SERVICE,
  type PushNotificationService,
} from '../../../domain/services/push-notification-service'
import { AlarmDTO } from '../../dtos/alarm-dto'

export interface SendAlarmNotificationRequest {
  userId: string
  alarm: AlarmDTO
}

@Injectable()
export class SendAlarmNotificationUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY)
    private readonly deviceRepository: DeviceRepository,
    @Inject(PUSH_NOTIFICATION_SERVICE)
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async execute(request: SendAlarmNotificationRequest): Promise<void> {
    const devices = await this.deviceRepository.findByUserId(request.userId)
    const activeDevices = devices.filter((device) => device.isActive)

    await Promise.all(
      activeDevices.map((device) =>
        this.pushNotificationService.send({
          to: device.pushToken,
          title: request.alarm.title,
          body: this.buildBody(request.alarm),
          data: {
            type: 'ALARM_TRIGGERED',
            alarmId: request.alarm.id,
          },
        }),
      ),
    )
  }

  private buildBody(alarm: AlarmDTO): string {
    return alarm.address
      ? `Voce esta perto de ${alarm.address}.`
      : 'Voce esta perto do destino do alarme.'
  }
}
