import { z } from 'zod'
import { PaymentProvider } from '../../../domain/entities/Subscription'

export const confirmSubscriptionPurchaseBodySchema = z
  .object({
    provider: z.nativeEnum(PaymentProvider, {
      error: 'Provider invalido. Opcoes validas: GOOGLE, APPLE.',
    }),
    purchaseToken: z.string().trim().min(1, 'Token da compra é obrigatorio.'),
  })
  .strict()
