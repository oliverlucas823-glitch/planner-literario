import StripeLib from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY || ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = secretKey && !secretKey.includes('placeholder')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? new StripeLib(secretKey, { apiVersion: '2024-06-20' as any })
  : null
