import { Router } from 'express'
import multer from 'multer'
import { authenticateToken } from '../middlewares/auth.middleware'
import { list, create, update, remove, uploadPhoto } from '../controllers/authors.controller'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
})

const router = Router()

router.get('/', authenticateToken, list)
router.post('/', authenticateToken, create)
router.put('/:id', authenticateToken, update)
router.delete('/:id', authenticateToken, remove)
router.post('/:id/photo', authenticateToken, upload.single('photo'), uploadPhoto)

export default router
