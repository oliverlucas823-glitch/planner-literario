import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

// ── Schemas ───────────────────────────────────────────────────────────────────

const createItemSchema = z.object({
  type: z.enum(['quote', 'book_goal', 'author', 'image_url', 'text']),
  content: z.string().max(2000).optional().nullable(),
  position_x: z.number().int().default(0),
  position_y: z.number().int().default(0),
  width: z.number().int().min(100).max(800).default(200),
  height: z.number().int().min(80).max(600).default(150),
  bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FAF7F2'),
})

const updateItemSchema = createItemSchema.partial()

// ── Controllers ───────────────────────────────────────────────────────────────

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.visionBoardItem.findMany({
      where: { user_id: req.user!.id },
      orderBy: { created_at: 'asc' },
    })
    res.status(200).json({ items })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createItemSchema.parse(req.body)
    const item = await prisma.visionBoardItem.create({
      data: { ...data, user_id: req.user!.id },
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const existing = await prisma.visionBoardItem.findFirst({ where: { id, user_id: req.user!.id } })
    if (!existing) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    const data = updateItemSchema.parse(req.body)
    const item = await prisma.visionBoardItem.update({ where: { id }, data })
    res.status(200).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const existing = await prisma.visionBoardItem.findFirst({ where: { id, user_id: req.user!.id } })
    if (!existing) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    await prisma.visionBoardItem.delete({ where: { id } })
    res.status(200).json({ message: 'Item removido' })
  } catch (err) {
    next(err)
  }
}
