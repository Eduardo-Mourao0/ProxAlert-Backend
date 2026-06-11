import { Injectable } from '@nestjs/common'
import { AlarmProximityState } from '../../domain/entities/AlarmProximityState'
import { AlarmProximityStateRepository } from '../../domain/repositories/alarm-proximity-state-repository'
import { PrismaService } from '../database/prisma/prisma.service'

@Injectable()
export class PrismaAlarmProximityStateRepository
  implements AlarmProximityStateRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByAlarmIdAndUserId(
    alarmId: string,
    userId: string,
  ): Promise<AlarmProximityState | null> {
    const state = await this.prisma.client.alarmProximityState.findUnique({
      where: {
        alarmId_userId: {
          alarmId,
          userId,
        },
      },
    })

    if (!state) return null

    return this.toDomain(state)
  }

  async save(state: AlarmProximityState): Promise<AlarmProximityState> {
    const savedState = await this.prisma.client.alarmProximityState.upsert({
      where: {
        alarmId_userId: {
          alarmId: state.alarmId,
          userId: state.userId,
        },
      },
      create: {
        id: state.id,
        alarmId: state.alarmId,
        userId: state.userId,
        isInsideRadius: state.isInsideRadius,
        dismissedUntilExit: state.dismissedUntilExit,
        lastDistanceInMeters: state.lastDistanceInMeters,
        lastTriggeredAt: state.lastTriggeredAt,
        dismissedAt: state.dismissedAt,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      },
      update: {
        isInsideRadius: state.isInsideRadius,
        dismissedUntilExit: state.dismissedUntilExit,
        lastDistanceInMeters: state.lastDistanceInMeters,
        lastTriggeredAt: state.lastTriggeredAt,
        dismissedAt: state.dismissedAt,
        updatedAt: state.updatedAt,
      },
    })

    return this.toDomain(savedState)
  }

  private toDomain(state: {
    id: string
    alarmId: string
    userId: string
    isInsideRadius: boolean
    dismissedUntilExit: boolean
    lastDistanceInMeters: number | null
    lastTriggeredAt: Date | null
    dismissedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): AlarmProximityState {
    return AlarmProximityState.createFromPrimitives(state)
  }
}
