import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error]', err)

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Dados inválidos', details: err.issues })
    return
  }

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err instanceof Error
        ? err.message
        : 'Erro interno do servidor'

  res.status(500).json({ error: message })
}
