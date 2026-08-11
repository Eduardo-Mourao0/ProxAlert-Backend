import { Injectable } from '@nestjs/common'
import { AlarmTrigger } from '../../domain/entities/AlarmTrigger'
import { AlarmTriggerRepository } from '../../domain/repositories/alarm-trigger-repository'
import { PrismaService } from '../database/prisma/prisma.service'

@Injectable()
export class PrismaAlarmTriggerRepository implements AlarmTriggerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(alarmTrigger: AlarmTrigger): Promise<AlarmTrigger> {
    const createdAlarmTrigger = await this.prisma.client.alarmTrigger.create({
      data: {
        id: alarmTrigger.id,
        alarmId: alarmTrigger.alarmId,
        userId: alarmTrigger.userId,
        latitude: alarmTrigger.latitude,
        longitude: alarmTrigger.longitude,
        distanceInMeters: alarmTrigger.distanceInMeters,
        triggeredAt: alarmTrigger.triggeredAt,
      },
    })

    return this.toDomain(createdAlarmTrigger)
  }

  async findByAlarmId(alarmId: string): Promise<AlarmTrigger[]> {
    const triggers = await this.prisma.client.alarmTrigger.findMany({
      where: { alarmId },
      orderBy: { triggeredAt: 'desc' },
    })

    return triggers.map((trigger) => this.toDomain(trigger))
  }

  private toDomain(trigger: {
    id: string
    alarmId: string
    userId: string
    latitude: number
    longitude: number
    distanceInMeters: number
    triggeredAt: Date
  }): AlarmTrigger {
    return AlarmTrigger.createFromPrimitives(trigger)
  }
}
