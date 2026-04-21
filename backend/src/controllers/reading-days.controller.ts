import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { calculateStreak } from '../lib/streak'

// ── Schemas ───────────────────────────────────────────────────────────────────

const createReadingDaySchema = z.object({
  book_id: z.string().cuid(),
  read_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD'),
})

const listReadingDaysSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  month: z.coerce.number().int().min(1).max(12).optional(),
  book_id: z.string().cuid().optional(),
})

// ── Controllers ───────────────────────────────────────────────────────────────

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { year, month, book_id } = listReadingDaysSchema.parse(req.query)
    const userId = req.user!.id

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`)
    const startOfNextYear = new Date(`${year + 1}-01-01T00:00:00.000Z`)

    const where: Record<string, unknown> = {
      user_id: userId,
      read_date: { gte: startOfYear, lt: startOfNextYear },
    }

    if (month !== undefined) {
      const paddedMonth = String(month).padStart(2, '0')
      const startOfMonth = new Date(`${year}-${paddedMonth}-01T00:00:00.000Z`)
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const paddedNext = String(nextMonth).padStart(2, '0')
      const startOfNextMonth = new Date(`${nextYear}-${paddedNext}-01T00:00:00.000Z`)
      where.read_date = { gte: startOfMonth, lt: startOfNextMonth }
    }

    if (book_id) where.book_id = book_id

    const reading_days = await prisma.readingDay.findMany({
      where,
      include: {
        book: { select: { title: true, author: true, cover_url: true } },
      },
      orderBy: { read_date: 'desc' },
    })

    res.status(200).json({ reading_days })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { book_id, read_date } = createReadingDaySchema.parse(req.body)
    const userId = req.user!.id

    const book = await prisma.book.findFirst({ where: { id: book_id, user_id: userId } })
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' })
      return
    }

    const dateObj = new Date(`${read_date}T00:00:00.000Z`)

    const reading_day = await prisma.readingDay.upsert({
      where: { user_id_book_id_read_date: { user_id: userId, book_id, read_date: dateObj } },
      create: { user_id: userId, book_id, read_date: dateObj },
      update: {},
    })

    res.status(201).json({ reading_day })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const day = await prisma.readingDay.findFirst({
      where: { id, user_id: req.user!.id },
    })
    if (!day) {
      res.status(404).json({ error: 'Dia de leitura não encontrado' })
      return
    }

    await prisma.readingDay.delete({ where: { id } })

    res.status(200).json({ message: 'Dia de leitura removido' })
  } catch (err) {
    next(err)
  }
}

export async function getStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await calculateStreak(req.user!.id)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
