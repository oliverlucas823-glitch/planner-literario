import { api } from '@/lib/axios'

export const subscriptionApi = {
  createCheckout: (price_id: string, success_url: string, cancel_url: string) =>
    api.post('/api/stripe/create-checkout', { price_id, success_url, cancel_url }),

  createPortal: (return_url: string) =>
    api.post('/api/stripe/create-portal', { return_url }),

  getSubscription: () =>
    api.get('/api/stripe/subscription'),
}
