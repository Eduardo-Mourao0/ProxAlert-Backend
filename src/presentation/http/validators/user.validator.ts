import { z } from 'zod'
import { Plan } from '../../../domain/entities/User'

export const createUserBodySchema = z.object({
  name: z.string().trim().min(2, 'Nome e obrigatorio.'),
  email: z.string().trim().email('Email invalido.'),
  password: z.string().trim().min(4, 'Senha deve ter no minimo 4 caracteres.'),
  confirmpassword: z.string().trim().min(4, 'Confirmacao de senha deve ter no minimo 4 caracteres.'),
  plan: z.nativeEnum(Plan).optional(),
}).refine((data) => data.password === data.confirmpassword, {
  message: 'As senhas nao coincidem.',
  path: ['confirmpassword'],
}).strict()

export const deleteUserBodySchema = z.object({}).strict()

export const upgradeUserBodySchema = z.object({
  name: z.string().trim().min(2, 'Nome e obrigatorio.').optional(),
  email: z.string().trim().email('Email invalido.').optional(),
}).strict().refine((data) => data.name || data.email, {
  message: 'Informe nome ou email para atualizar.',
})

export const changeUserPasswordBodySchema = z.object({
  currentPassword: z.string().trim().min(4, 'Senha atual deve ter no minimo 4 caracteres.'),
  password: z.string().trim().min(4, 'Senha deve ter no minimo 4 caracteres.'),
  confirmpassword: z.string().trim().min(4, 'Confirmacao de senha deve ter no minimo 4 caracteres.'),
}).refine((data) => data.password === data.confirmpassword, {
  message: 'As senhas nao coincidem.',
  path: ['confirmpassword'],
}).strict()

export const updateUserPlanBodySchema = z.object({
  plan: z.nativeEnum(Plan),
}).strict()
