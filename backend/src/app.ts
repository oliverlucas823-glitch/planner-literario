import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.routes'
import booksRoutes from './routes/books.routes'
import readingDaysRoutes from './routes/reading-days.routes'
import challengesRoutes from './routes/challenges.routes'
import visionBoardRoutes from './routes/vision-board.routes'
import authorsRoutes from './routes/authors.routes'
import statsRoutes from './routes/stats.routes'
import stripeRoutes from './routes/stripe.routes'
import { webhook } from './controllers/stripe.controller'
import { errorMiddleware } from './middlewares/error.middleware'

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

// Stripe webhook must receive the raw body — registered before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhook)

app.use(express.json())

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

app.use('/api/auth', authRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/reading-days', readingDaysRoutes)
app.use('/api/challenges', challengesRoutes)
app.use('/api/vision-board', visionBoardRoutes)
app.use('/api/authors', authorsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/stripe', stripeRoutes)

app.use(errorMiddleware)

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
