import { Injectable } from '@nestjs/common'
import { decode, sign } from 'jsonwebtoken'
import { SubscriptionStatus } from '../../../domain/entities/Subscription'
import { BusinessError } from '../../../domain/errors/business-error'
import { VerifiedSubscriptionPurchase } from '../../../domain/services/subscription-payment-service'
import {
  getOptionalEnv,
  getRequiredEnv,
  isFutureDate,
  normalizePrivateKey,
} from './subscription-service-utils'

interface AppleSubscriptionResponse {
  data?: Array<{
    lastTransactions?: Array<{
      status?: number
      signedTransactionInfo?: string
      originalTransactionId?: string
    }>
  }>
}

interface AppleTransactionPayload {
  productId?: string
  transactionId?: string
  originalTransactionId?: string
  expiresDate?: number
}

@Injectable()
export class AppleStoreSubscriptionService {
  async verify(transactionId: string): Promise<VerifiedSubscriptionPurchase> {
    const premiumProductId = getRequiredEnv('APPLE_PREMIUM_PRODUCT_ID')
    const token = this.createToken()
    const baseUrl =
      getOptionalEnv('APPLE_ENVIRONMENT') === 'production'
        ? 'https://api.storekit.apple.com'
        : 'https://api.storekit-sandbox.apple.com'
    const url = `${baseUrl}/inApps/v1/subscriptions/${encodeURIComponent(
      transactionId,
    )}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new BusinessError('Apple purchase verification failed.', 400)
    }

    const data = (await response.json()) as AppleSubscriptionResponse
    const transaction = this.findPremiumTransaction(data, premiumProductId)

    if (!transaction) {
      throw new BusinessError('Apple subscription product is invalid.', 400)
    }

    return transaction
  }

  private createToken(): string {
    const issuerId = getRequiredEnv('APPLE_ISSUER_ID')
    const keyId = getRequiredEnv('APPLE_KEY_ID')
    const bundleId = getRequiredEnv('APPLE_BUNDLE_ID')
    const privateKey = getRequiredEnv('APPLE_PRIVATE_KEY')
    const now = Math.floor(Date.now() / 1000)

    return sign(
      {
        iss: issuerId,
        iat: now,
        exp: now + 3600,
        aud: 'appstoreconnect-v1',
        bid: bundleId,
      },
      normalizePrivateKey(privateKey),
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: keyId,
        },
      },
    )
  }

  private findPremiumTransaction(response: AppleSubscriptionResponse,premiumProductId: string): VerifiedSubscriptionPurchase | null {
    for (const subscriptionGroup of response.data ?? []) {
      for (const transaction of subscriptionGroup.lastTransactions ?? []) {
        const payload = this.decodeTransaction(transaction.signedTransactionInfo)

        if (!payload || payload.productId !== premiumProductId) {
          continue
        }

        const providerTransactionId =
          payload.originalTransactionId ??
          transaction.originalTransactionId ??
          payload.transactionId

        if (!providerTransactionId) {
          continue
        }

        const expiresAt = payload.expiresDate
          ? new Date(payload.expiresDate)
          : null

        return {
          providerSubscriptionId: premiumProductId,
          providerTransactionId,
          status: this.mapStatus(transaction.status, expiresAt),
          expiresAt,
        }
      }
    }

    return null
  }

  private decodeTransaction(signedTransactionInfo: string | undefined): AppleTransactionPayload | null {
    if (!signedTransactionInfo) {
      return null
    }

    const payload = decode(signedTransactionInfo)

    if (!payload || typeof payload === 'string') {
      return null
    }

    return payload as AppleTransactionPayload
  }

  private mapStatus(status: number | undefined,expiresAt: Date | null): SubscriptionStatus {
    if (status === 1) {
      return isFutureDate(expiresAt)
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.EXPIRED
    }

    if (status === 3 || status === 4) {
      return SubscriptionStatus.PAST_DUE
    }

    if (status === 2) {
      return SubscriptionStatus.EXPIRED
    }

    return SubscriptionStatus.CANCELED
  }
}
