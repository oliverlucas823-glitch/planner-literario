import StripeLib from 'stripe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new StripeLib(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any })
