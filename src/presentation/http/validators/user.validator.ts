import { z } from 'zod'
import { Plan } from '../../../domain/entities/User'

export const createUserBodySchema = z.object({
  name: z.string().trim().min(2, 'Nome é obrigatorio.'),
  email: z.string().trim().email('Email invalido.'),
  password: z.string().trim().min(4, 'Senha deve ter no mínimo 4 caracteres.'),
  confirmpassword: z.string().trim().min(4, 'Confirmação de senha deve ter no mínimo 4 caracteres.'),
  plan: z.nativeEnum(Plan).optional(),
}).refine((data) => data.password === data.confirmpassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmpassword'],
}).strict()

export const deleteUserBodySchema = z.object({
  userId: z.string().uuid(),
}).strict()

export const upgradeUserBodySchema = z.object({
  userId: z.string().uuid(),
  name: z.string().trim().min(2, 'Nome é obrigatorio.'),
  email: z.string().trim().email('Email invalido.'),
}).strict()

export const changeUserPasswordBodySchema = z.object({
  password: z.string().trim().min(4, 'Senha deve ter no mínimo 4 caracteres.'),
  confirmpassword: z.string().trim().min(4, 'Confirmação de senha deve ter no mínimo 4 caracteres.'),
}).refine((data) => data.password === data.confirmpassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmpassword'],
}).strict()
