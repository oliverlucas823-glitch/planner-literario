import { Router } from 'express'
import multer from 'multer'
import { authenticateToken } from '../middlewares/auth.middleware'
import { requirePro } from '../middlewares/pro.middleware'
import {
  list,
  create,
  getById,
  update,
  remove,
  uploadCoverHandler,
} from '../controllers/books.controller'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
})

const router = Router()

router.get('/', authenticateToken, list)
router.post('/', authenticateToken, create)
router.get('/:id', authenticateToken, getById)
router.put('/:id', authenticateToken, update)
router.delete('/:id', authenticateToken, remove)
router.post('/:id/cover', authenticateToken, requirePro, upload.single('cover'), uploadCoverHandler)

export default router
