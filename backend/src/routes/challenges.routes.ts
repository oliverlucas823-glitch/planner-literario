import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import {
  list,
  create,
  getById,
  update,
  remove,
  assignBook,
} from '../controllers/challenges.controller'

const router = Router()

router.get('/', authenticateToken, list)
router.post('/', authenticateToken, create)
router.get('/:id', authenticateToken, getById)
router.put('/:id', authenticateToken, update)
router.delete('/:id', authenticateToken, remove)
router.put('/:challengeId/items/:itemId', authenticateToken, assignBook)

export default router
