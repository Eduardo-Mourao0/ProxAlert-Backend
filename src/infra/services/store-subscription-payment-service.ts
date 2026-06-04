import { Injectable } from '@nestjs/common'
import { sign, decode } from 'jsonwebtoken'
import {
  PaymentProvider,
  SubscriptionStatus,
} from '../../domain/entities/Subscription'
import { BusinessError } from '../../domain/errors/business-error'
import {
  SubscriptionPaymentService,
  VerifiedSubscriptionPurchase,
  VerifySubscriptionPurchaseRequest,
} from '../../domain/services/subscription-payment-service'

interface GoogleAccessTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface GoogleSubscriptionResponse {
  lineItems?: Array<{
    productId?: string
    expiryTime?: string
  }>
  latestOrderId?: string
  subscriptionState?: string
}

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
export class StoreSubscriptionPaymentService
  implements SubscriptionPaymentService
{
  async verifyPurchase(
    request: VerifySubscriptionPurchaseRequest,
  ): Promise<VerifiedSubscriptionPurchase> {
    if (request.provider === PaymentProvider.GOOGLE) {
      return this.verifyGooglePurchase(request.purchaseToken)
    }

    if (request.provider === PaymentProvider.APPLE) {
      return this.verifyApplePurchase(request.purchaseToken)
    }

    throw new BusinessError('Payment provider is not supported.', 400)
  }

  private async verifyGooglePurchase(
    purchaseToken: string,
  ): Promise<VerifiedSubscriptionPurchase> {
    const packageName = this.getRequiredEnv('GOOGLE_PLAY_PACKAGE_NAME')
    const premiumProductId = this.getRequiredEnv(
      'GOOGLE_PLAY_PREMIUM_PRODUCT_ID',
    )
    const accessToken = await this.getGoogleAccessToken()
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3` +
      `/applications/${encodeURIComponent(packageName)}` +
      `/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new BusinessError('Google Play purchase verification failed.', 400)
    }

    const data = (await response.json()) as GoogleSubscriptionResponse
    const lineItem = data.lineItems?.find(
      (currentLineItem) => currentLineItem.productId === premiumProductId,
    )

    if (!lineItem) {
      throw new BusinessError('Google Play subscription product is invalid.', 400)
    }

    const expiresAt = lineItem.expiryTime
      ? new Date(lineItem.expiryTime)
      : null

    return {
      providerSubscriptionId: premiumProductId,
      providerTransactionId: data.latestOrderId ?? purchaseToken,
      status: this.mapGoogleStatus(data.subscriptionState, expiresAt),
      expiresAt,
    }
  }

  private async getGoogleAccessToken(): Promise<string> {
    const email = this.getRequiredEnv('GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL')
    const privateKey = this.getRequiredEnv(
      'GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY',
    )
    const now = Math.floor(Date.now() / 1000)
    const assertion = sign(
      {
        iss: email,
        scope: 'https://www.googleapis.com/auth/androidpublisher',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      },
      this.normalizePrivateKey(privateKey),
      { algorithm: 'RS256' },
    )

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    })

    const data = (await response.json()) as GoogleAccessTokenResponse

    if (!response.ok || !data.access_token) {
      throw new BusinessError('Google Play authentication failed.', 400)
    }

    return data.access_token
  }

  private mapGoogleStatus(
    subscriptionState: string | undefined,
    expiresAt: Date | null,
  ): SubscriptionStatus {
    if (
      subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
      subscriptionState === 'SUBSCRIPTION_STATE_CANCELED'
    ) {
      return this.isFutureDate(expiresAt)
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.EXPIRED
    }

    if (
      subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ||
      subscriptionState === 'SUBSCRIPTION_STATE_ON_HOLD'
    ) {
      return SubscriptionStatus.PAST_DUE
    }

    return SubscriptionStatus.EXPIRED
  }

  private async verifyApplePurchase(
    transactionId: string,
  ): Promise<VerifiedSubscriptionPurchase> {
    const premiumProductId = this.getRequiredEnv('APPLE_PREMIUM_PRODUCT_ID')
    const token = this.createAppleToken()
    const baseUrl =
      this.getOptionalEnv('APPLE_ENVIRONMENT') === 'production'
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
    const transaction = this.findApplePremiumTransaction(data, premiumProductId)

    if (!transaction) {
      throw new BusinessError('Apple subscription product is invalid.', 400)
    }

    return transaction
  }

  private createAppleToken(): string {
    const issuerId = this.getRequiredEnv('APPLE_ISSUER_ID')
    const keyId = this.getRequiredEnv('APPLE_KEY_ID')
    const bundleId = this.getRequiredEnv('APPLE_BUNDLE_ID')
    const privateKey = this.getRequiredEnv('APPLE_PRIVATE_KEY')
    const now = Math.floor(Date.now() / 1000)

    return sign(
      {
        iss: issuerId,
        iat: now,
        exp: now + 3600,
        aud: 'appstoreconnect-v1',
        bid: bundleId,
      },
      this.normalizePrivateKey(privateKey),
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: keyId,
        },
      },
    )
  }

  private findApplePremiumTransaction(
    response: AppleSubscriptionResponse,
    premiumProductId: string,
  ): VerifiedSubscriptionPurchase | null {
    for (const subscriptionGroup of response.data ?? []) {
      for (const transaction of subscriptionGroup.lastTransactions ?? []) {
        const payload = this.decodeAppleTransaction(
          transaction.signedTransactionInfo,
        )

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
          status: this.mapAppleStatus(transaction.status, expiresAt),
          expiresAt,
        }
      }
    }

    return null
  }

  private decodeAppleTransaction(
    signedTransactionInfo: string | undefined,
  ): AppleTransactionPayload | null {
    if (!signedTransactionInfo) {
      return null
    }

    const payload = decode(signedTransactionInfo)

    if (!payload || typeof payload === 'string') {
      return null
    }

    return payload as AppleTransactionPayload
  }

  private mapAppleStatus(
    status: number | undefined,
    expiresAt: Date | null,
  ): SubscriptionStatus {
    if (status === 1) {
      return this.isFutureDate(expiresAt)
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

  private isFutureDate(date: Date | null): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime()) && date > new Date()
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name]

    if (!value) {
      throw new BusinessError(`Missing environment variable: ${name}`, 500)
    }

    return value
  }

  private getOptionalEnv(name: string): string | undefined {
    return process.env[name]
  }

  private normalizePrivateKey(privateKey: string): string {
    return privateKey.replace(/\\n/g, '\n')
  }
}
