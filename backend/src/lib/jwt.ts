import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? ''
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? ''

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_SECRET)
  if (typeof payload === 'string' || !('userId' in payload)) {
    throw new Error('Token inválido')
  }
  return { userId: payload.userId as string }
}

export function verifyRefreshToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET)
  if (typeof payload === 'string' || !('userId' in payload)) {
    throw new Error('Token inválido')
  }
  return { userId: payload.userId as string }
}
