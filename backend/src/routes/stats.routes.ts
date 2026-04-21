import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import { requirePro } from '../middlewares/pro.middleware'
import {
  overview,
  byMonth,
  byGenre,
  byFormat,
  pagesEvolution,
  ratingsByGenre,
  worstBooks,
} from '../controllers/stats.controller'

const router = Router()

router.get('/overview', authenticateToken, requirePro, overview)
router.get('/by-month', authenticateToken, requirePro, byMonth)
router.get('/by-genre', authenticateToken, requirePro, byGenre)
router.get('/by-format', authenticateToken, requirePro, byFormat)
router.get('/pages-evolution', authenticateToken, requirePro, pagesEvolution)
router.get('/ratings-by-genre', authenticateToken, requirePro, ratingsByGenre)
router.get('/worst-books', authenticateToken, requirePro, worstBooks)

export default router
