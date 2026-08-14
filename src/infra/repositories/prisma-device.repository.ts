import { Injectable } from '@nestjs/common'
import { Device, DevicePlatform } from '../../domain/entities/Device'
import { DeviceRepository } from '../../domain/repositories/device-repository'
import { PrismaService } from '../database/prisma/prisma.service'

@Injectable()
export class PrismaDeviceRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(device: Device): Promise<Device> {
    const createdDevice = await this.prisma.client.device.create({
      data: {
        id: device.id,
        userId: device.userId,
        pushToken: device.pushToken,
        platform: device.platform,
        isActive: device.isActive,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
      },
    })

    return this.toDomain(createdDevice)
  }

  async findById(id: string): Promise<Device | null> {
    const device = await this.prisma.client.device.findUnique({
      where: { id },
    })

    if (!device) return null

    return this.toDomain(device)
  }

  async findByPushToken(pushToken: string): Promise<Device | null> {
    const device = await this.prisma.client.device.findUnique({
      where: { pushToken },
    })

    if (!device) return null

    return this.toDomain(device)
  }

  async findByUserId(userId: string): Promise<Device[]> {
    const devices = await this.prisma.client.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return devices.map((device) => this.toDomain(device))
  }

  async update(device: Device): Promise<Device> {
    const updatedDevice = await this.prisma.client.device.update({
      where: { id: device.id },
      data: {
        userId: device.userId,
        pushToken: device.pushToken,
        platform: device.platform,
        isActive: device.isActive,
        updatedAt: device.updatedAt,
      },
    })

    return this.toDomain(updatedDevice)
  }

  private toDomain(device: {
    id: string
    userId: string
    pushToken: string
    platform: DevicePlatform
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }): Device {
    return Device.createFromPrimitives(device)
  }
}
