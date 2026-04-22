"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.uploadPhoto = uploadPhoto;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const storage_service_1 = require("../lib/storage.service");
// ── Schemas ───────────────────────────────────────────────────────────────────
const createAuthorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    nationality: zod_1.z.string().max(100).optional().nullable(),
    notes: zod_1.z.string().max(2000).optional().nullable(),
    is_national: zod_1.z.boolean().default(false),
});
const updateAuthorSchema = createAuthorSchema.partial();
const listQuerySchema = zod_1.z.object({
    is_national: zod_1.z.coerce.boolean().optional(),
});
// ── Controllers ───────────────────────────────────────────────────────────────
async function list(req, res, next) {
    try {
        const { is_national } = listQuerySchema.parse(req.query);
        const where = { user_id: req.user.id };
        if (is_national !== undefined)
            where.is_national = is_national;
        const authors = await prisma_1.prisma.favoriteAuthor.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        res.status(200).json({ authors });
    }
    catch (err) {
        next(err);
    }
}
async function create(req, res, next) {
    try {
        const data = createAuthorSchema.parse(req.body);
        const author = await prisma_1.prisma.favoriteAuthor.create({
            data: { ...data, user_id: req.user.id },
        });
        res.status(201).json({ author });
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await prisma_1.prisma.favoriteAuthor.findFirst({ where: { id, user_id: req.user.id } });
        if (!existing) {
            res.status(404).json({ error: 'Autor não encontrado' });
            return;
        }
        const data = updateAuthorSchema.parse(req.body);
        const author = await prisma_1.prisma.favoriteAuthor.update({ where: { id }, data });
        res.status(200).json({ author });
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await prisma_1.prisma.favoriteAuthor.findFirst({ where: { id, user_id: req.user.id } });
        if (!existing) {
            res.status(404).json({ error: 'Autor não encontrado' });
            return;
        }
        await prisma_1.prisma.favoriteAuthor.delete({ where: { id } });
        res.status(200).json({ message: 'Autor removido' });
    }
    catch (err) {
        next(err);
    }
}
async function uploadPhoto(req, res, next) {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'Arquivo não enviado' });
            return;
        }
        if (!file.mimetype.startsWith('image/')) {
            res.status(400).json({ error: 'Apenas imagens são permitidas' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            res.status(400).json({ error: 'Arquivo muito grande. Máximo 2MB' });
            return;
        }
        const authorId = String(req.params.id);
        const author = await prisma_1.prisma.favoriteAuthor.findFirst({
            where: { id: authorId, user_id: req.user.id },
        });
        if (!author) {
            res.status(404).json({ error: 'Autor não encontrado' });
            return;
        }
        if (author.photo_url) {
            await (0, storage_service_1.deleteCover)((0, storage_service_1.getFilenameFromUrl)(author.photo_url));
        }
        const ext = file.mimetype.split('/')[1] ?? 'jpg';
        const filename = `authors/${req.user.id}/${authorId}-${Date.now()}.${ext}`;
        const photo_url = await (0, storage_service_1.uploadCover)(file.buffer, filename, file.mimetype);
        await prisma_1.prisma.favoriteAuthor.update({ where: { id: authorId }, data: { photo_url } });
        res.status(200).json({ photo_url });
    }
    catch (err) {
        next(err);
    }
}
