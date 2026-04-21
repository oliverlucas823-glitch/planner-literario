import { Request, Response, NextFunction } from 'express'

export function requirePro(req: Request, res: Response, next: NextFunction): void {
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  if (user.subscription_status === 'active') {
    next()
    return
  }

  if (
    user.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date()
  ) {
    next()
    return
  }

  res.status(403).json({
    error: 'Funcionalidade exclusiva do plano PRO',
    upgrade_url: '/assinatura',
  })
}
