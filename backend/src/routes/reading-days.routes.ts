import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import {
  list,
  create,
  remove,
  getStreak,
} from '../controllers/reading-days.controller'

const router = Router()

// /streak must be registered before /:id to avoid param conflict
router.get('/streak', authenticateToken, getStreak)
router.get('/', authenticateToken, list)
router.post('/', authenticateToken, create)
router.delete('/:id', authenticateToken, remove)

export default router
