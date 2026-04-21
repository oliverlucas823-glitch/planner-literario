import { useAuthStore } from '@/store/authStore'
import { subscriptionApi } from '@/api/subscription'

export function useSubscription() {
  const { user, isPro } = useAuthStore()

  const startCheckout = async (priceId: string) => {
    const base = window.location.origin
    const { data } = await subscriptionApi.createCheckout(
      priceId,
      `${base}/assinatura?success=true`,
      `${base}/assinatura`,
    )
    window.location.href = (data as { url: string }).url
  }

  const openPortal = async () => {
    const { data } = await subscriptionApi.createPortal(`${window.location.origin}/assinatura`)
    window.location.href = (data as { url: string }).url
  }

  return {
    isPro,
    subscriptionStatus: user?.subscription_status ?? 'free',
    expiresAt: user?.subscription_expires_at ? new Date(user.subscription_expires_at) : null,
    startCheckout,
    openPortal,
  }
}
