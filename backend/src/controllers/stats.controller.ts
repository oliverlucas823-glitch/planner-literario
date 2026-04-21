import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { calculateStreak } from '../lib/streak'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const FORMAT_LABELS: Record<string, string> = {
  fisico: 'Físico',
  ebook: 'eBook',
  audiobook: 'Audiobook',
}

const yearSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
})

function yearRange(year: number) {
  return {
    gte: new Date(`${year}-01-01T00:00:00.000Z`),
    lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
  }
}

export async function overview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id
    const currentYear = new Date().getFullYear()

    const [readThisYear, allBooks, streakData] = await Promise.all([
      prisma.book.findMany({
        where: { user_id: userId, status: 'lido', end_date: yearRange(currentYear) },
        select: { pages: true, genre: true },
      }),
      prisma.book.findMany({
        where: { user_id: userId },
        select: { status: true },
      }),
      calculateStreak(userId),
    ])

    const booksWithPages = readThisYear.filter((b) => b.pages != null)
    const avgPages =
      booksWithPages.length > 0
        ? Math.round(booksWithPages.reduce((sum, b) => sum + b.pages!, 0) / booksWithPages.length)
        : 0

    const genreCounts: Record<string, number> = {}
    for (const b of readThisYear) {
      if (b.genre) genreCounts[b.genre] = (genreCounts[b.genre] ?? 0) + 1
    }
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const byStatus = allBooks.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1
      return acc
    }, {})

    res.status(200).json({
      total_read_this_year: readThisYear.length,
      avg_pages_per_book: avgPages,
      top_genre: topGenre,
      current_streak: streakData.current_streak,
      books_by_status: byStatus,
    })
  } catch (err) {
    next(err)
  }
}

export async function byMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { year } = yearSchema.parse(req.query)
    const userId = req.user!.id

    const books = await prisma.book.findMany({
      where: { user_id: userId, status: 'lido', end_date: yearRange(year) },
      select: { end_date: true },
    })

    const data = MONTH_NAMES.map((month_name, i) => ({ month: i + 1, month_name, count: 0 }))
    for (const b of books) {
      if (b.end_date) data[b.end_date.getUTCMonth()].count++
    }

    res.status(200).json({ data, year })
  } catch (err) {
    next(err)
  }
}

export async function byGenre(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const books = await prisma.book.findMany({
      where: { user_id: req.user!.id, status: 'lido', genre: { not: null } },
      select: { genre: true },
    })

    const counts: Record<string, number> = {}
    for (const b of books) {
      if (b.genre) counts[b.genre] = (counts[b.genre] ?? 0) + 1
    }

    const total = books.length || 1
    const data = Object.entries(counts)
      .map(([genre, count]) => ({ genre, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)

    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function byFormat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const books = await prisma.book.findMany({
      where: { user_id: req.user!.id, format: { not: null } },
      select: { format: true },
    })

    const counts: Record<string, number> = {}
    for (const b of books) {
      if (b.format) counts[b.format] = (counts[b.format] ?? 0) + 1
    }

    const total = books.length || 1
    const data = Object.entries(counts).map(([format, count]) => ({
      format,
      label: FORMAT_LABELS[format] ?? format,
      count,
      percentage: Math.round((count / total) * 100),
    }))

    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function pagesEvolution(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { year } = yearSchema.parse(req.query)
    const userId = req.user!.id

    const books = await prisma.book.findMany({
      where: {
        user_id: userId,
        status: 'lido',
        end_date: yearRange(year),
        pages: { not: null },
      },
      select: { end_date: true, pages: true },
      orderBy: { end_date: 'asc' },
    })

    const data = MONTH_NAMES.map((month_name, i) => ({
      month: i + 1,
      month_name,
      pages_read: 0,
      cumulative_pages: 0,
    }))

    for (const b of books) {
      if (b.end_date && b.pages) {
        data[b.end_date.getUTCMonth()].pages_read += b.pages
      }
    }

    let cumulative = 0
    for (const m of data) {
      cumulative += m.pages_read
      m.cumulative_pages = cumulative
    }

    res.status(200).json({ data, total_pages: cumulative })
  } catch (err) {
    next(err)
  }
}

export async function ratingsByGenre(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const books = await prisma.book.findMany({
      where: {
        user_id: req.user!.id,
        rating: { not: null },
        genre: { not: null },
      },
      select: { genre: true, rating: true },
    })

    const grouped: Record<string, number[]> = {}
    for (const b of books) {
      if (b.genre && b.rating != null) {
        grouped[b.genre] = grouped[b.genre] ?? []
        grouped[b.genre].push(b.rating)
      }
    }

    const data = Object.entries(grouped)
      .map(([genre, ratings]) => ({
        genre,
        count: ratings.length,
        average_rating: Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10,
      }))
      .sort((a, b) => b.average_rating - a.average_rating)

    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function worstBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const books = await prisma.book.findMany({
      where: { user_id: req.user!.id, rating: { lte: 2 } },
      select: { id: true, title: true, author: true, cover_url: true, rating: true, genre: true },
      orderBy: [{ rating: 'asc' }, { created_at: 'desc' }],
    })
    res.status(200).json({ books })
  } catch (err) {
    next(err)
  }
}
