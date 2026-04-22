"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.getById = getById;
exports.update = update;
exports.remove = remove;
exports.uploadCoverHandler = uploadCoverHandler;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const storage_service_1 = require("../lib/storage.service");
// ── Schemas ──────────────────────────────────────────────────────────────────
const createBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    author: zod_1.z.string().min(1).max(255),
    genre: zod_1.z.string().max(100).nullish(),
    pages: zod_1.z.number().int().positive().nullish(),
    format: zod_1.z.enum(['fisico', 'ebook', 'audiobook']).nullish(),
    status: zod_1.z.enum(['lendo', 'lido', 'abandonado', 'quero_ler']).optional(),
    // date inputs send "YYYY-MM-DD" — .datetime() would reject that format
    start_date: zod_1.z.string().nullish(),
    end_date: zod_1.z.string().nullish(),
    rating: zod_1.z.number().min(1).max(5).nullish(),
    rating_plot: zod_1.z.number().min(1).max(5).nullish(),
    rating_characters: zod_1.z.number().min(1).max(5).nullish(),
    rating_ending: zod_1.z.number().min(1).max(5).nullish(),
    rating_writing: zod_1.z.number().min(1).max(5).nullish(),
    emotions: zod_1.z.array(zod_1.z.string()).nullish(),
    review: zod_1.z.string().max(5000).nullish(),
    would_recommend: zod_1.z.boolean().nullish(),
    is_favorite: zod_1.z.boolean().nullish(),
    favorite_quote: zod_1.z.string().max(1000).nullish(),
    series_name: zod_1.z.string().max(255).nullish(),
    series_position: zod_1.z.number().int().positive().nullish(),
    is_trilogy: zod_1.z.boolean().nullish(),
    wishlist: zod_1.z.boolean().nullish(),
    abandonment_reason: zod_1.z.string().max(1000).nullish(),
    progress: zod_1.z.number().int().min(0).max(100).nullish(),
});
// Separate update schema: nullable Prisma fields accept null, non-nullable only accept undefined (omit)
const updateBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255).optional(),
    author: zod_1.z.string().min(1).max(255).optional(),
    genre: zod_1.z.string().max(100).nullish(),
    pages: zod_1.z.number().int().positive().nullish(),
    format: zod_1.z.enum(['fisico', 'ebook', 'audiobook']).nullish(),
    status: zod_1.z.enum(['lendo', 'lido', 'abandonado', 'quero_ler']).optional(),
    start_date: zod_1.z.string().nullish(),
    end_date: zod_1.z.string().nullish(),
    rating: zod_1.z.number().min(1).max(5).nullish(),
    rating_plot: zod_1.z.number().min(1).max(5).nullish(),
    rating_characters: zod_1.z.number().min(1).max(5).nullish(),
    rating_ending: zod_1.z.number().min(1).max(5).nullish(),
    rating_writing: zod_1.z.number().min(1).max(5).nullish(),
    emotions: zod_1.z.array(zod_1.z.string()).optional(),
    review: zod_1.z.string().max(5000).nullish(),
    would_recommend: zod_1.z.boolean().nullish(),
    is_favorite: zod_1.z.boolean().optional(),
    favorite_quote: zod_1.z.string().max(1000).nullish(),
    series_name: zod_1.z.string().max(255).nullish(),
    series_position: zod_1.z.number().int().positive().nullish(),
    is_trilogy: zod_1.z.boolean().optional(),
    wishlist: zod_1.z.boolean().optional(),
    abandonment_reason: zod_1.z.string().max(1000).nullish(),
    progress: zod_1.z.number().int().min(0).max(100).optional(),
});
const listBooksSchema = zod_1.z.object({
    status: zod_1.z.enum(['lendo', 'lido', 'abandonado', 'quero_ler']).optional(),
    genre: zod_1.z.string().optional(),
    rating: zod_1.z.coerce.number().int().min(1).max(5).optional(),
    search: zod_1.z.string().optional(),
    is_favorite: zod_1.z.coerce.boolean().optional(),
    wishlist: zod_1.z.coerce.boolean().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    sort_by: zod_1.z
        .enum(['created_at', 'updated_at', 'title', 'author', 'rating', 'start_date', 'end_date'])
        .default('updated_at'),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// ── Helpers ───────────────────────────────────────────────────────────────────
const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_BYTES = 2 * 1024 * 1024;
function extFromMime(mimetype) {
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    };
    return map[mimetype] ?? 'jpg';
}
// ── Controllers ───────────────────────────────────────────────────────────────
async function list(req, res, next) {
    try {
        const query = listBooksSchema.parse(req.query);
        const { status, genre, rating, search, is_favorite, wishlist, page, limit, sort_by, sort_order } = query;
        const userId = req.user.id;
        const where = { user_id: userId };
        if (status)
            where.status = status;
        if (genre)
            where.genre = genre;
        if (rating !== undefined)
            where.rating = rating;
        if (is_favorite)
            where.is_favorite = true;
        if (wishlist)
            where.wishlist = true;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [books, total] = await Promise.all([
            prisma_1.prisma.book.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sort_by]: sort_order },
            }),
            prisma_1.prisma.book.count({ where }),
        ]);
        res.status(200).json({
            books,
            pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        next(err);
    }
}
async function create(req, res, next) {
    try {
        const data = createBookSchema.parse(req.body);
        const user = req.user;
        if (user.subscription_status !== 'active') {
            const count = await prisma_1.prisma.book.count({ where: { user_id: user.id } });
            if (count >= 10) {
                res.status(403).json({
                    error: 'Limite de 10 livros atingido no plano gratuito',
                    upgrade_url: '/assinatura',
                });
                return;
            }
        }
        const start_date = data.start_date && data.start_date !== '' ? new Date(data.start_date) : null;
        const end_date = data.end_date && data.end_date !== '' ? new Date(data.end_date) : null;
        if (end_date && data.status !== 'lido') {
            res.status(400).json({
                error: 'Data de término só é permitida para livros com status lido',
            });
            return;
        }
        const book = await prisma_1.prisma.book.create({
            data: {
                ...data,
                user_id: user.id,
                status: data.status ?? 'quero_ler',
                emotions: data.emotions ?? [],
                is_favorite: data.is_favorite ?? false,
                is_trilogy: data.is_trilogy ?? false,
                wishlist: data.wishlist ?? false,
                progress: data.progress ?? 0,
                start_date,
                end_date,
            },
        });
        res.status(201).json({ book });
    }
    catch (err) {
        next(err);
    }
}
async function getById(req, res, next) {
    try {
        const id = String(req.params.id);
        const book = await prisma_1.prisma.book.findFirst({
            where: { id, user_id: req.user.id },
            include: {
                reading_days: { select: { id: true, read_date: true } },
            },
        });
        if (!book) {
            res.status(404).json({ error: 'Livro não encontrado' });
            return;
        }
        res.status(200).json({ book });
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await prisma_1.prisma.book.findFirst({
            where: { id, user_id: req.user.id },
        });
        if (!existing) {
            res.status(404).json({ error: 'Livro não encontrado' });
            return;
        }
        const data = updateBookSchema.parse(req.body);
        const start_date = 'start_date' in data
            ? (data.start_date && data.start_date !== '' ? new Date(data.start_date) : null)
            : undefined;
        const end_date = 'end_date' in data
            ? (data.end_date && data.end_date !== '' ? new Date(data.end_date) : null)
            : undefined;
        const status = data.status ?? existing.status;
        const resolvedEndDate = end_date !== undefined ? end_date : existing.end_date;
        if (resolvedEndDate && status !== 'lido') {
            res.status(400).json({
                error: 'Data de término só é permitida para livros com status lido',
            });
            return;
        }
        const book = await prisma_1.prisma.book.update({
            where: { id },
            data: { ...data, start_date, end_date },
        });
        res.status(200).json({ book });
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        const id = String(req.params.id);
        const book = await prisma_1.prisma.book.findFirst({
            where: { id, user_id: req.user.id },
        });
        if (!book) {
            res.status(404).json({ error: 'Livro não encontrado' });
            return;
        }
        if (book.cover_url) {
            const filename = (0, storage_service_1.getFilenameFromUrl)(book.cover_url);
            await (0, storage_service_1.deleteCover)(filename);
        }
        await prisma_1.prisma.book.delete({ where: { id } });
        res.status(200).json({ message: 'Livro removido com sucesso' });
    }
    catch (err) {
        next(err);
    }
}
async function uploadCoverHandler(req, res, next) {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'Arquivo não enviado' });
            return;
        }
        if (!ALLOWED_COVER_TYPES.includes(file.mimetype)) {
            res.status(400).json({ error: 'Formato inválido. Use JPEG, PNG ou WebP' });
            return;
        }
        if (file.size > MAX_COVER_BYTES) {
            res.status(400).json({ error: 'Arquivo muito grande. Máximo 2MB' });
            return;
        }
        const bookId = String(req.params.id);
        const book = await prisma_1.prisma.book.findFirst({
            where: { id: bookId, user_id: req.user.id },
        });
        if (!book) {
            res.status(404).json({ error: 'Livro não encontrado' });
            return;
        }
        if (book.cover_url) {
            await (0, storage_service_1.deleteCover)((0, storage_service_1.getFilenameFromUrl)(book.cover_url));
        }
        const ext = extFromMime(file.mimetype);
        const filename = `${req.user.id}/${bookId}-${Date.now()}.${ext}`;
        const cover_url = await (0, storage_service_1.uploadCover)(file.buffer, filename, file.mimetype);
        await prisma_1.prisma.book.update({ where: { id: bookId }, data: { cover_url } });
        res.status(200).json({ cover_url });
    }
    catch (err) {
        next(err);
    }
}
