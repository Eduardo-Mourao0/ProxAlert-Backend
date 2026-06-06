import { BusinessError } from '../../../domain/errors/business-error'

export function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new BusinessError(`Missing environment variable: ${name}`, 500)
  }

  return value
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name]
}

export function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n')
}

export function isFutureDate(date: Date | null): boolean {
  return (
    date instanceof Date &&
    !Number.isNaN(date.getTime()) &&
    date > new Date()
  )
}
