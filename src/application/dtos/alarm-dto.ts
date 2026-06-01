import { Alarm } from '../../domain/entities/Alarm'

export interface AlarmDTO {
  id: string
  userId: string
  title: string
  description: string | null
  isActive: boolean
  latitude: number
  longitude: number
  radius: number
  createdAt: Date
}

export function toAlarmDTO(alarm: Alarm): AlarmDTO {
  return {
    id: alarm.id,
    userId: alarm.userId,
    title: alarm.title,
    description: alarm.description,
    isActive: alarm.isActive,
    latitude: alarm.latitude,
    longitude: alarm.longitude,
    radius: alarm.radius,
    createdAt: alarm.createdAt,
  }
}
