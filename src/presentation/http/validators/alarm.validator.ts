import { z } from 'zod'

export const createAlarmBodySchema = z.object({
  title: z.string().trim().min(2, 'Titulo e obrigatorio.'),
  description: z.string().trim().max(255, 'Descricao deve ter no maximo 255 caracteres.').nullable().optional(),
  address: z.string().trim().max(255, 'Endereco deve ter no maximo 255 caracteres.').nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(50).max(50000),
}).strict()

export const updateAlarmBodySchema = z.object({
  title: z.string().trim().min(2, 'Titulo e obrigatorio.').optional(),
  description: z.string().trim().max(255, 'Descricao deve ter no maximo 255 caracteres.').nullable().optional(),
  address: z.string().trim().max(255, 'Endereco deve ter no maximo 255 caracteres.').nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(50).max(50000).optional(),
}).strict().refine((data) => (
  data.title !== undefined ||
  data.description !== undefined ||
  data.address !== undefined ||
  data.latitude !== undefined ||
  data.longitude !== undefined ||
  data.radius !== undefined
), {
  message: 'Informe ao menos um campo para atualizar.',
})

export const alarmParamsSchema = z.object({
  alarmId: z.string().uuid('Alarm id invalido.'),
}).strict()
