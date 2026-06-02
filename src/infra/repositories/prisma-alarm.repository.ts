import { Injectable } from '@nestjs/common'
import { Alarm } from '../../domain/entities/Alarm'
import { AlarmRepository } from '../../domain/repositories/alarm-repository'
import { PrismaService } from '../database/prisma/prisma.service'

@Injectable()
export class PrismaAlarmRepository implements AlarmRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(alarm: Alarm): Promise<Alarm> {
    const createdAlarm = await this.prisma.alarm.create({
      data: {
        id: alarm.id,
        userId: alarm.userId,
        title: alarm.title,
        description: alarm.description,
        address: alarm.address,
        latitude: alarm.latitude,
        longitude: alarm.longitude,
        radius: alarm.radius,
        isActive: alarm.isActive,
        createdAt: alarm.createdAt,
      },
    })

    return this.toDomain(createdAlarm)
  }

  async findById(id: string): Promise<Alarm | null> {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
    })

    if (!alarm) return null

    return this.toDomain(alarm)
  }

  async findByUserId(userId: string): Promise<Alarm[]> {
    const alarms = await this.prisma.alarm.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return alarms.map((alarm) => this.toDomain(alarm))
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.alarm.count({
      where: { userId },
    })
  }

  async update(alarm: Alarm): Promise<Alarm> {
    const updatedAlarm = await this.prisma.alarm.update({
      where: { id: alarm.id },
      data: {
        title: alarm.title,
        description: alarm.description,
        address: alarm.address,
        latitude: alarm.latitude,
        longitude: alarm.longitude,
        radius: alarm.radius,
        isActive: alarm.isActive,
      },
    })

    return this.toDomain(updatedAlarm)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.alarm.delete({
      where: { id },
    })
  }

  private toDomain(alarm: {
    id: string
    userId: string
    title: string
    description: string | null
    address: string | null
    isActive: boolean
    latitude: number
    longitude: number
    radius: number
    createdAt: Date
  }): Alarm {
    return Alarm.createFromPrimitives({
      id: alarm.id,
      userId: alarm.userId,
      title: alarm.title,
      description: alarm.description,
      address: alarm.address,
      isActive: alarm.isActive,
      latitude: alarm.latitude,
      longitude: alarm.longitude,
      radius: alarm.radius,
      createdAt: alarm.createdAt,
    })
  }
}
