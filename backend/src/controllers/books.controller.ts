import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { uploadCover, deleteCover, getFilenameFromUrl } from '../lib/storage.service'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createBookSchema = z.object({
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(255),
  genre: z.string().max(100).optional(),
  pages: z.number().int().positive().optional(),
  format: z.enum(['fisico', 'ebook', 'audiobook']).optional(),
  status: z.enum(['lendo', 'lido', 'abandonado', 'quero_ler']).default('quero_ler'),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  rating_plot: z.number().int().min(1).max(5).optional().nullable(),
  rating_characters: z.number().int().min(1).max(5).optional().nullable(),
  rating_ending: z.number().int().min(1).max(5).optional().nullable(),
  rating_writing: z.number().int().min(1).max(5).optional().nullable(),
  emotions: z.array(z.string()).default([]),
  review: z.string().max(5000).optional().nullable(),
  would_recommend: z.boolean().optional().nullable(),
  is_favorite: z.boolean().default(false),
  favorite_quote: z.string().max(1000).optional().nullable(),
  series_name: z.string().max(255).optional().nullable(),
  series_position: z.number().int().positive().optional().nullable(),
  is_trilogy: z.boolean().default(false),
  wishlist: z.boolean().default(false),
  abandonment_reason: z.string().max(1000).optional().nullable(),
  progress: z.number().int().min(0).max(100).default(0),
})

const updateBookSchema = createBookSchema.partial()

const listBooksSchema = z.object({
  status: z.enum(['lendo', 'lido', 'abandonado', 'quero_ler']).optional(),
  genre: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
  is_favorite: z.coerce.boolean().optional(),
  wishlist: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort_by: z
    .enum(['created_at', 'title', 'author', 'rating', 'start_date', 'end_date'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_COVER_BYTES = 2 * 1024 * 1024

function extFromMime(mimetype: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[mimetype] ?? 'jpg'
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listBooksSchema.parse(req.query)
    const { status, genre, rating, search, is_favorite, wishlist, page, limit, sort_by, sort_order } = query
    const userId = req.user!.id

    const where: Record<string, unknown> = { user_id: userId }
    if (status) where.status = status
    if (genre) where.genre = genre
    if (rating !== undefined) where.rating = rating
    if (is_favorite) where.is_favorite = true
    if (wishlist) where.wishlist = true
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort_by]: sort_order },
      }),
      prisma.book.count({ where }),
    ])

    res.status(200).json({
      books,
      pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createBookSchema.parse(req.body)
    const user = req.user!

    if (user.subscription_status !== 'active') {
      const count = await prisma.book.count({ where: { user_id: user.id } })
      if (count >= 10) {
        res.status(403).json({
          error: 'Limite de 10 livros atingido no plano gratuito',
          upgrade_url: '/assinatura',
        })
        return
      }
    }

    if (data.end_date && data.status !== 'lido') {
      res.status(400).json({
        error: 'Data de término só é permitida para livros com status lido',
      })
      return
    }

    const book = await prisma.book.create({
      data: { ...data, user_id: user.id },
    })

    res.status(201).json({ book })
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const book = await prisma.book.findFirst({
      where: { id, user_id: req.user!.id },
      include: {
        reading_days: { select: { id: true, read_date: true } },
      },
    })

    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' })
      return
    }

    res.status(200).json({ book })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const existing = await prisma.book.findFirst({
      where: { id, user_id: req.user!.id },
    })
    if (!existing) {
      res.status(404).json({ error: 'Livro não encontrado' })
      return
    }

    const data = updateBookSchema.parse(req.body)

    const status = data.status ?? existing.status
    const end_date = 'end_date' in data ? data.end_date : existing.end_date

    if (end_date && status !== 'lido') {
      res.status(400).json({
        error: 'Data de término só é permitida para livros com status lido',
      })
      return
    }

    const book = await prisma.book.update({
      where: { id },
      data,
    })

    res.status(200).json({ book })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const book = await prisma.book.findFirst({
      where: { id, user_id: req.user!.id },
    })
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' })
      return
    }

    if (book.cover_url) {
      const filename = getFilenameFromUrl(book.cover_url)
      await deleteCover(filename)
    }

    await prisma.book.delete({ where: { id } })

    res.status(200).json({ message: 'Livro removido com sucesso' })
  } catch (err) {
    next(err)
  }
}

export async function uploadCoverHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Arquivo não enviado' })
      return
    }

    if (!ALLOWED_COVER_TYPES.includes(file.mimetype)) {
      res.status(400).json({ error: 'Formato inválido. Use JPEG, PNG ou WebP' })
      return
    }

    if (file.size > MAX_COVER_BYTES) {
      res.status(400).json({ error: 'Arquivo muito grande. Máximo 2MB' })
      return
    }

    const bookId = String(req.params.id)
    const book = await prisma.book.findFirst({
      where: { id: bookId, user_id: req.user!.id },
    })
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' })
      return
    }

    if (book.cover_url) {
      await deleteCover(getFilenameFromUrl(book.cover_url))
    }

    const ext = extFromMime(file.mimetype)
    const filename = `${req.user!.id}/${bookId}-${Date.now()}.${ext}`
    const cover_url = await uploadCover(file.buffer, filename, file.mimetype)

    await prisma.book.update({ where: { id: bookId }, data: { cover_url } })

    res.status(200).json({ cover_url })
  } catch (err) {
    next(err)
  }
}
