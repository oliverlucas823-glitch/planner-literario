import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { stripe } from '../lib/stripe'
import { prisma } from '../lib/prisma'

const checkoutSchema = z.object({
  price_id: z.string(),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
})

const portalSchema = z.object({
  return_url: z.string().url(),
})

function extractCustomerId(customer: unknown): string | null {
  if (!customer) return null
  if (typeof customer === 'string') return customer
  if (typeof customer === 'object' && customer !== null && 'id' in customer) {
    return String((customer as { id: unknown }).id)
  }
  return null
}

export async function createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!stripe) {
      res.status(503).json({ error: 'Pagamentos não configurados neste ambiente' })
      return
    }

    const { price_id, success_url, cancel_url } = checkoutSchema.parse(req.body)
    const user = req.user!

    const allowedPrices = [
      process.env.STRIPE_PRICE_MONTHLY,
      process.env.STRIPE_PRICE_YEARLY,
    ].filter(Boolean)

    if (!allowedPrices.includes(price_id)) {
      res.status(400).json({ error: 'Plano inválido' })
      return
    }

    let stripeCustomerId = user.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { user_id: user.id },
      })
      stripeCustomerId = customer.id
      await prisma.user.update({
        where: { id: user.id },
        data: { stripe_customer_id: stripeCustomerId },
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: { user_id: user.id },
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    next(err)
  }
}

export async function createPortal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!stripe) {
      res.status(503).json({ error: 'Pagamentos não configurados neste ambiente' })
      return
    }

    const user = req.user!

    if (!user.stripe_customer_id) {
      res.status(400).json({ error: 'Usuário sem assinatura ativa' })
      return
    }

    const { return_url } = portalSchema.parse(req.body)

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    next(err)
  }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { subscription_status, subscription_expires_at, stripe_subscription_id } = req.user!
    res.status(200).json({ subscription_status, subscription_expires_at, stripe_subscription_id })
  } catch (err) {
    next(err)
  }
}

export async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!stripe) {
    res.status(503).json({ error: 'Pagamentos não configurados neste ambiente' })
    return
  }

  const sig = req.headers['stripe-signature'] as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch {
    res.status(400).json({ error: 'Assinatura inválida' })
    return
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = event.data.object as Record<string, any>

    switch (event.type as string) {
      case 'checkout.session.completed': {
        const userId = obj.metadata?.user_id as string | undefined
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscription_status: 'active',
              stripe_subscription_id: obj.subscription as string,
              subscription_expires_at: null,
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const customerId = extractCustomerId(obj.customer)
        if (customerId) {
          const newStatus =
            obj.status === 'active' ? 'active'
            : obj.status === 'past_due' ? 'past_due'
            : String(obj.status)
          await prisma.user.updateMany({
            where: { stripe_customer_id: customerId },
            data: {
              subscription_status: newStatus,
              subscription_expires_at: new Date((obj.current_period_end as number) * 1000),
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const customerId = extractCustomerId(obj.customer)
        if (customerId) {
          await prisma.user.updateMany({
            where: { stripe_customer_id: customerId },
            data: {
              subscription_status: 'canceled',
              subscription_expires_at: new Date((obj.current_period_end as number) * 1000),
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const customerId = extractCustomerId(obj.customer)
        if (customerId) {
          await prisma.user.updateMany({
            where: { stripe_customer_id: customerId },
            data: { subscription_status: 'past_due' },
          })
        }
        break
      }
    }

    res.status(200).json({ received: true })
  } catch (err) {
    next(err)
  }
}
