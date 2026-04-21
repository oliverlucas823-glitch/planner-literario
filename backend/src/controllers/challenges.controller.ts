import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

// ── Constants ─────────────────────────────────────────────────────────────────

const BINGO_CATEGORIES = [
  'Livro de autora mulher', 'Clássico da literatura', 'Romance', 'Ficção científica',
  'Mais de 500 páginas', 'Indicado por alguém', 'Autor nacional', 'Lançamento do ano',
  'Livro de capa colorida', 'Releitura ou adaptação', 'Fantasia', 'Biografia ou memórias',
  'Mistério ou suspense', 'Livro em série', 'Premiado', 'Autoajuda ou desenvolvimento',
  'Distopia', 'Conto ou novela', 'Terror ou horror', 'Histórico',
  'LGBTQIA+', 'Livro emprestado', 'Traduzido', 'Sem ler há mais de 1 ano', 'Livre escolha',
]

const COLORS = ['Vermelho', 'Laranja', 'Amarelo', 'Verde', 'Azul', 'Roxo', 'Rosa', 'Preto', 'Branco', 'Marrom']

const NUMERIC_GOALS: Record<string, number> = { '10': 10, '25': 25, '50': 50, '100': 100 }

// ── Schemas ───────────────────────────────────────────────────────────────────

const createChallengeSchema = z.object({
  type: z.enum(['10', '25', '50', '100', 'cores', 'bingo', 'custom']),
  name: z.string().min(1).max(255),
  goal: z.number().int().positive().optional(),
  year: z.number().int().min(2000).max(2100).default(new Date().getFullYear()),
})

const updateChallengeSchema = createChallengeSchema.partial()

const assignBookSchema = z.object({
  book_id: z.string().cuid().nullable(),
  completed: z.boolean().optional(),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildItems(type: string, challengeId: string, resolvedGoal: number) {
  const base = { challenge_id: challengeId, completed: false }

  if (type in NUMERIC_GOALS) {
    const n = NUMERIC_GOALS[type]
    return Array.from({ length: n }, (_, i) => ({ ...base, slot_label: `Livro ${i + 1}`, position: i }))
  }
  if (type === 'bingo') {
    return BINGO_CATEGORIES.map((cat, i) => ({ ...base, slot_label: cat, position: i }))
  }
  if (type === 'cores') {
    return COLORS.map((color, i) => ({ ...base, slot_label: color, position: i }))
  }
  // custom
  return Array.from({ length: resolvedGoal }, (_, i) => ({ ...base, slot_label: `Item ${i + 1}`, position: i }))
}

const challengeInclude = {
  items: {
    include: { book: { select: { id: true, title: true, author: true, cover_url: true } } },
    orderBy: { position: 'asc' as const },
  },
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = await prisma.challenge.findMany({
      where: { user_id: req.user!.id },
      include: challengeInclude,
      orderBy: { created_at: 'desc' },
    })

    const challenges = raw.map((c) => ({
      ...c,
      completed_count: c.items.filter((i) => i.completed).length,
    }))

    res.status(200).json({ challenges })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!
    const { type, name, goal, year } = createChallengeSchema.parse(req.body)

    if (user.subscription_status !== 'active') {
      const count = await prisma.challenge.count({ where: { user_id: user.id, is_active: true } })
      if (count >= 1) {
        res.status(403).json({
          error: 'Limite de 1 desafio atingido no plano gratuito',
          upgrade_url: '/assinatura',
        })
        return
      }
    }

    if (type === 'custom' && !goal) {
      res.status(400).json({ error: 'goal é obrigatório para desafio custom' })
      return
    }

    let resolvedGoal: number
    if (type in NUMERIC_GOALS) {
      resolvedGoal = NUMERIC_GOALS[type]
    } else if (type === 'bingo') {
      resolvedGoal = 25
    } else if (type === 'cores') {
      resolvedGoal = goal ?? 10
    } else {
      resolvedGoal = goal!
    }

    const challenge = await prisma.challenge.create({
      data: { user_id: user.id, type, name, goal: resolvedGoal, year },
    })

    await prisma.challengeItem.createMany({ data: buildItems(type, challenge.id, resolvedGoal) })

    const challengeWithItems = await prisma.challenge.findUnique({
      where: { id: challenge.id },
      include: challengeInclude,
    })

    res.status(201).json({ challenge: challengeWithItems })
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const challenge = await prisma.challenge.findFirst({
      where: { id, user_id: req.user!.id },
      include: challengeInclude,
    })
    if (!challenge) {
      res.status(404).json({ error: 'Desafio não encontrado' })
      return
    }
    res.status(200).json({ challenge })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const existing = await prisma.challenge.findFirst({ where: { id, user_id: req.user!.id } })
    if (!existing) {
      res.status(404).json({ error: 'Desafio não encontrado' })
      return
    }

    const data = updateChallengeSchema.parse(req.body)
    const challenge = await prisma.challenge.update({ where: { id }, data })
    res.status(200).json({ challenge })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id)
    const existing = await prisma.challenge.findFirst({ where: { id, user_id: req.user!.id } })
    if (!existing) {
      res.status(404).json({ error: 'Desafio não encontrado' })
      return
    }
    await prisma.challenge.delete({ where: { id } })
    res.status(200).json({ message: 'Desafio removido' })
  } catch (err) {
    next(err)
  }
}

export async function assignBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const challengeId = String(req.params.challengeId)
    const itemId = String(req.params.itemId)
    const userId = req.user!.id

    const challenge = await prisma.challenge.findFirst({ where: { id: challengeId, user_id: userId } })
    if (!challenge) {
      res.status(404).json({ error: 'Desafio não encontrado' })
      return
    }

    const item = await prisma.challengeItem.findFirst({
      where: { id: itemId, challenge_id: challengeId },
    })
    if (!item) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    const { book_id, completed } = assignBookSchema.parse(req.body)

    if (book_id !== null) {
      const book = await prisma.book.findFirst({ where: { id: book_id, user_id: userId } })
      if (!book) {
        res.status(400).json({ error: 'Livro não encontrado ou não pertence ao usuário' })
        return
      }
    }

    const updatedItem = await prisma.challengeItem.update({
      where: { id: itemId },
      data: {
        book_id,
        completed: completed ?? (book_id !== null),
      },
      include: { book: { select: { id: true, title: true, author: true, cover_url: true } } },
    })

    res.status(200).json({ item: updatedItem })
  } catch (err) {
    next(err)
  }
}
