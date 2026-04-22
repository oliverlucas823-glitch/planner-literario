"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckout = createCheckout;
exports.createPortal = createPortal;
exports.getSubscription = getSubscription;
exports.webhook = webhook;
const zod_1 = require("zod");
const stripe_1 = require("../lib/stripe");
const prisma_1 = require("../lib/prisma");
const checkoutSchema = zod_1.z.object({
    price_id: zod_1.z.string(),
    success_url: zod_1.z.string().url(),
    cancel_url: zod_1.z.string().url(),
});
const portalSchema = zod_1.z.object({
    return_url: zod_1.z.string().url(),
});
function extractCustomerId(customer) {
    if (!customer)
        return null;
    if (typeof customer === 'string')
        return customer;
    if (typeof customer === 'object' && customer !== null && 'id' in customer) {
        return String(customer.id);
    }
    return null;
}
async function createCheckout(req, res, next) {
    try {
        if (!stripe_1.stripe) {
            res.status(503).json({ error: 'Pagamentos não configurados neste ambiente' });
            return;
        }
        const { price_id, success_url, cancel_url } = checkoutSchema.parse(req.body);
        const user = req.user;
        const allowedPrices = [
            process.env.STRIPE_PRICE_MONTHLY,
            process.env.STRIPE_PRICE_YEARLY,
        ].filter(Boolean);
        if (!allowedPrices.includes(price_id)) {
            res.status(400).json({ error: 'Plano inválido' });
            return;
        }
        let stripeCustomerId = user.stripe_customer_id;
        if (!stripeCustomerId) {
            const customer = await stripe_1.stripe.customers.create({
                email: user.email,
                name: user.name ?? undefined,
                metadata: { user_id: user.id },
            });
            stripeCustomerId = customer.id;
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { stripe_customer_id: stripeCustomerId },
            });
        }
        const session = await stripe_1.stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            line_items: [{ price: price_id, quantity: 1 }],
            success_url,
            cancel_url,
            metadata: { user_id: user.id },
        });
        res.status(200).json({ url: session.url });
    }
    catch (err) {
        next(err);
    }
}
async function createPortal(req, res, next) {
    try {
        if (!stripe_1.stripe) {
            res.status(503).json({ error: 'Pagamentos não configurados neste ambiente' });
            return;
        }
        const user = req.user;
        if (!user.stripe_customer_id) {
            res.status(400).json({ error: 'Usuário sem assinatura ativa' });
            return;
        }
        const { return_url } = portalSchema.parse(req.body);
        const session = await stripe_1.stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url,
        });
        res.status(200).json({ url: session.url });
    }
    catch (err) {
        next(err);
    }
}
async function getSubscription(req, res, next) {
    try {
        const { subscription_status, subscription_expires_at, stripe_subscription_id } = req.user;
        res.status(200).json({ subscription_status, subscription_expires_at, stripe_subscription_id });
    }
    catch (err) {
        next(err);
    }
}
async function webhook(req, res, next) {
    if (!stripe_1.stripe) {
        res.status(503).json({ error: 'Pagamentos não configurados neste ambiente' });
        return;
    }
    const sig = req.headers['stripe-signature'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    }
    catch {
        res.status(400).json({ error: 'Assinatura inválida' });
        return;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = event.data.object;
        switch (event.type) {
            case 'checkout.session.completed': {
                const userId = obj.metadata?.user_id;
                if (userId) {
                    await prisma_1.prisma.user.update({
                        where: { id: userId },
                        data: {
                            subscription_status: 'active',
                            stripe_subscription_id: obj.subscription,
                            subscription_expires_at: null,
                        },
                    });
                }
                break;
            }
            case 'customer.subscription.updated': {
                const customerId = extractCustomerId(obj.customer);
                if (customerId) {
                    const newStatus = obj.status === 'active' ? 'active'
                        : obj.status === 'past_due' ? 'past_due'
                            : String(obj.status);
                    await prisma_1.prisma.user.updateMany({
                        where: { stripe_customer_id: customerId },
                        data: {
                            subscription_status: newStatus,
                            subscription_expires_at: new Date(obj.current_period_end * 1000),
                        },
                    });
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const customerId = extractCustomerId(obj.customer);
                if (customerId) {
                    await prisma_1.prisma.user.updateMany({
                        where: { stripe_customer_id: customerId },
                        data: {
                            subscription_status: 'canceled',
                            subscription_expires_at: new Date(obj.current_period_end * 1000),
                        },
                    });
                }
                break;
            }
            case 'invoice.payment_failed': {
                const customerId = extractCustomerId(obj.customer);
                if (customerId) {
                    await prisma_1.prisma.user.updateMany({
                        where: { stripe_customer_id: customerId },
                        data: { subscription_status: 'past_due' },
                    });
                }
                break;
            }
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        next(err);
    }
}
