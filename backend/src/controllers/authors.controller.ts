import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { uploadCover, deleteCover, getFilenameFromUrl } from '../lib/storage.service'

// ── Schemas ───────────────────────────────────────────────────────────────────

const createAuthorSchema = z.object({
  name: z.string().min(1).max(255),
  nationality: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  is_national: z.boolean().default(false),
})

const updateAuthorSchema = createAuthorSchema.partial()

const listQuerySchema = z.object({
  is_national: z.coerce.boolean().optional(),
})

// ── Controllers ───────────────────────────────────────────────────────────────

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { is_national } = listQuerySchema.parse(req.query)
    const where: Record<string, unknown> = { user_id: req.user!.id }
    if (is_national !== undefined) where.is_national = is_national

    const authors = await prisma.favoriteAuthor.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    res.status(200).json({ authors })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createAuthorSchema.parse(req.body)
    const author = await prisma.favoriteAuthor.create({
      data: { ...data, user_id: req.user!.id },
    })
    res.status(201).json({ author })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const existing = await prisma.favoriteAuthor.findFirst({ where: { id, user_id: req.user!.id } })
    if (!existing) {
      res.status(404).json({ error: 'Autor não encontrado' })
      return
    }

    const data = updateAuthorSchema.parse(req.body)
    const author = await prisma.favoriteAuthor.update({ where: { id }, data })
    res.status(200).json({ author })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const existing = await prisma.favoriteAuthor.findFirst({ where: { id, user_id: req.user!.id } })
    if (!existing) {
      res.status(404).json({ error: 'Autor não encontrado' })
      return
    }

    await prisma.favoriteAuthor.delete({ where: { id } })
    res.status(200).json({ message: 'Autor removido' })
  } catch (err) {
    next(err)
  }
}

export async function uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Arquivo não enviado' })
      return
    }

    if (!file.mimetype.startsWith('image/')) {
      res.status(400).json({ error: 'Apenas imagens são permitidas' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      res.status(400).json({ error: 'Arquivo muito grande. Máximo 2MB' })
      return
    }

    const authorId = String(req.params.id)
    const author = await prisma.favoriteAuthor.findFirst({
      where: { id: authorId, user_id: req.user!.id },
    })
    if (!author) {
      res.status(404).json({ error: 'Autor não encontrado' })
      return
    }

    if (author.photo_url) {
      await deleteCover(getFilenameFromUrl(author.photo_url))
    }

    const ext = file.mimetype.split('/')[1] ?? 'jpg'
    const filename = `authors/${req.user!.id}/${authorId}-${Date.now()}.${ext}`
    const photo_url = await uploadCover(file.buffer, filename, file.mimetype)

    await prisma.favoriteAuthor.update({ where: { id: authorId }, data: { photo_url } })

    res.status(200).json({ photo_url })
  } catch (err) {
    next(err)
  }
}
