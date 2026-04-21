import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import { createCheckout, createPortal, getSubscription } from '../controllers/stripe.controller'

const router = Router()

router.post('/create-checkout', authenticateToken, createCheckout)
router.post('/create-portal', authenticateToken, createPortal)
router.get('/subscription', authenticateToken, getSubscription)

export default router
