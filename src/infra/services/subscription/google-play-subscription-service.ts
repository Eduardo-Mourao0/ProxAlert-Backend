import { Injectable } from '@nestjs/common'
import { sign } from 'jsonwebtoken'
import { SubscriptionStatus } from '../../../domain/entities/Subscription'
import { BusinessError } from '../../../domain/errors/business-error'
import { VerifiedSubscriptionPurchase } from '../../../domain/services/subscription-payment-service'
import {
  getRequiredEnv,
  isFutureDate,
  normalizePrivateKey,
} from './subscription-service-utils'

interface GoogleAccessTokenResponse {
  access_token?: string
}

interface GoogleSubscriptionResponse {
  lineItems?: Array<{
    productId?: string
    expiryTime?: string
  }>
  latestOrderId?: string
  subscriptionState?: string
}

@Injectable()
export class GooglePlaySubscriptionService {
  async verify(purchaseToken: string): Promise<VerifiedSubscriptionPurchase> {
    const packageName = getRequiredEnv('GOOGLE_PLAY_PACKAGE_NAME')
    const premiumProductId = getRequiredEnv('GOOGLE_PLAY_PREMIUM_PRODUCT_ID')
    const accessToken = await this.getAccessToken()
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
      throw new BusinessError('Google Play subscription product is invalid.',400)
    }

    const expiresAt = lineItem.expiryTime ? new Date(lineItem.expiryTime) : null

    return {
      providerSubscriptionId: premiumProductId,
      providerTransactionId: purchaseToken,
      status: this.mapStatus(data.subscriptionState, expiresAt),
      expiresAt,
    }
  }

  private async getAccessToken(): Promise<string> {
    const email = getRequiredEnv('GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL')
    const privateKey = getRequiredEnv('GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY')
    const now = Math.floor(Date.now() / 1000)
    const assertion = sign(
      {
        iss: email,
        scope: 'https://www.googleapis.com/auth/androidpublisher',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      },
      normalizePrivateKey(privateKey),
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

  private mapStatus(subscriptionState: string | undefined, expiresAt: Date | null): SubscriptionStatus {
    if (
      subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' || subscriptionState === 'SUBSCRIPTION_STATE_CANCELED'
    ) {
      return isFutureDate(expiresAt) ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED
    }

    if (
      subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' || subscriptionState === 'SUBSCRIPTION_STATE_ON_HOLD'
    ) {
      return SubscriptionStatus.PAST_DUE
    }

    return SubscriptionStatus.EXPIRED
  }
}
