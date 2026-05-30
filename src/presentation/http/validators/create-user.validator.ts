import { z } from 'zod'
import { Plan } from '../../../domain/entities/User'

export const createUserBodySchema = z.object({
  name: z.string().trim().min(2, 'Nome é obrigatorio.'),
  email: z.string().trim().email('Email invalido.'),
  password: z.string().trim().min(4, 'Senha deve ter no mínimo 4 caracteres.'),
  plan: z.nativeEnum(Plan).optional(),
})
