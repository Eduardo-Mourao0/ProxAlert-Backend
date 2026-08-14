import { z } from 'zod'
import { DevicePlatform } from '../../../domain/entities/Device'

export const registerDeviceBodySchema = z.object({
  pushToken: z.string().trim().min(1, 'Push token e obrigatorio.'),
  platform: z.nativeEnum(DevicePlatform, 'Plataforma invalida. Opcoes validas: IOS, ANDROID.'),
}).strict()

export const deviceParamsSchema = z.object({
  deviceId: z.string().uuid('Device id invalido.'),
}).strict()
