import { Request, Response, NextFunction } from 'express'
import { User } from '@prisma/client'
import { verifyAccessToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password_hash' | 'password_reset_token' | 'password_reset_expires'>
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' })
    return
  }

  let userId: string
  try {
    ;({ userId } = verifyAccessToken(token))
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    res.status(401).json({ error: 'Usuário não encontrado' })
    return
  }

  const { password_hash, password_reset_token, password_reset_expires, ...safeUser } = user
  void password_hash
  void password_reset_token
  void password_reset_expires

  req.user = safeUser
  next()
}
