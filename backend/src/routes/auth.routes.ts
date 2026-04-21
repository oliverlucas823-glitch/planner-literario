import { Router } from 'express'
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
} from '../controllers/auth.controller'
import { authenticateToken } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', authenticateToken, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', authenticateToken, me)

export default router
