import { z } from 'zod'

export const authBodySchema = z.object({
    email: z.string().trim().email('Email invalido.'),
    password: z.string().trim().min(4, 'Senha deve ter no mínimo 4 caracteres.'),
}).strict()

export const refreshTokenBodySchema = z.object({
    refreshToken: z.string().trim().min(1, 'Refresh token e obrigatorio.'),
}).strict()
