import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import { requirePro } from '../middlewares/pro.middleware'
import { list, create, update, remove } from '../controllers/vision-board.controller'

const router = Router()

router.get('/', authenticateToken, requirePro, list)
router.post('/', authenticateToken, requirePro, create)
router.put('/:id', authenticateToken, requirePro, update)
router.delete('/:id', authenticateToken, requirePro, remove)

export default router
