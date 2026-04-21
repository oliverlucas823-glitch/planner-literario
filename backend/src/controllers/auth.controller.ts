import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../lib/jwt'
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/resend'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const refreshSchema = z.object({
  refresh_token: z.string(),
})

const forgotSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

function safeUser(user: { id: string; email: string; name: string | null; subscription_status: string }) {
  return { id: user.id, email: user.email, name: user.name, subscription_status: user.subscription_status }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado' })
      return
    }

    const password_hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password_hash, name },
    })

    const access_token = generateAccessToken(user.id)
    const refresh_token = generateRefreshToken(user.id)

    await prisma.refreshToken.create({
      data: {
        token: refresh_token,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    void sendWelcomeEmail(email, name)

    res.status(201).json({ user: safeUser(user), access_token, refresh_token })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    await prisma.refreshToken.deleteMany({
      where: { user_id: user.id, expires_at: { lt: new Date() } },
    })

    const access_token = generateAccessToken(user.id)
    const refresh_token = generateRefreshToken(user.id)

    await prisma.refreshToken.create({
      data: {
        token: refresh_token,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.status(200).json({ user: safeUser(user), access_token, refresh_token })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refresh_token } = refreshSchema.parse(req.body)

    let userId: string
    try {
      ;({ userId } = verifyRefreshToken(refresh_token))
    } catch {
      res.status(401).json({ error: 'Refresh token inválido' })
      return
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refresh_token } })
    if (!stored || stored.expires_at < new Date()) {
      res.status(401).json({ error: 'Refresh token inválido' })
      return
    }

    await prisma.refreshToken.delete({ where: { token: refresh_token } })

    const access_token = generateAccessToken(userId)
    const new_refresh_token = generateRefreshToken(userId)

    await prisma.refreshToken.create({
      data: {
        token: new_refresh_token,
        user_id: userId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.status(200).json({ access_token, refresh_token: new_refresh_token })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refresh_token } = refreshSchema.parse(req.body)
    await prisma.refreshToken.deleteMany({ where: { token: refresh_token } })
    res.status(200).json({ message: 'Logout realizado com sucesso' })
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = forgotSchema.parse(req.body)
    const SAFE_RESPONSE = { message: 'Se o email existir, você receberá as instruções' }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(200).json(SAFE_RESPONSE)
      return
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: hashedToken,
        password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const resetLink = `${process.env.FRONTEND_URL}/redefinir-senha?token=${rawToken}`
    await sendPasswordResetEmail(email, resetLink)

    res.status(200).json(SAFE_RESPONSE)
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = resetSchema.parse(req.body)

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findFirst({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: { gt: new Date() },
      },
    })

    if (!user) {
      res.status(400).json({ error: 'Token inválido ou expirado' })
      return
    }

    const password_hash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        password_reset_token: null,
        password_reset_expires: null,
      },
    })

    await prisma.refreshToken.deleteMany({ where: { user_id: user.id } })

    res.status(200).json({ message: 'Senha redefinida com sucesso' })
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ user: req.user })
  } catch (err) {
    next(err)
  }
}
