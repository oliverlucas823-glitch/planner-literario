"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
// ── Schemas ───────────────────────────────────────────────────────────────────
const createItemSchema = zod_1.z.object({
    type: zod_1.z.enum(['quote', 'book_goal', 'author', 'image_url', 'text']),
    content: zod_1.z.string().max(2000).optional().nullable(),
    position_x: zod_1.z.number().int().default(0),
    position_y: zod_1.z.number().int().default(0),
    width: zod_1.z.number().int().min(100).max(800).default(200),
    height: zod_1.z.number().int().min(80).max(600).default(150),
    bg_color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FAF7F2'),
});
const updateItemSchema = createItemSchema.partial();
// ── Controllers ───────────────────────────────────────────────────────────────
async function list(req, res, next) {
    try {
        const items = await prisma_1.prisma.visionBoardItem.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_at: 'asc' },
        });
        res.status(200).json({ items });
    }
    catch (err) {
        next(err);
    }
}
async function create(req, res, next) {
    try {
        const data = createItemSchema.parse(req.body);
        const item = await prisma_1.prisma.visionBoardItem.create({
            data: { ...data, user_id: req.user.id },
        });
        res.status(201).json({ item });
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await prisma_1.prisma.visionBoardItem.findFirst({ where: { id, user_id: req.user.id } });
        if (!existing) {
            res.status(404).json({ error: 'Item não encontrado' });
            return;
        }
        const data = updateItemSchema.parse(req.body);
        const item = await prisma_1.prisma.visionBoardItem.update({ where: { id }, data });
        res.status(200).json({ item });
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await prisma_1.prisma.visionBoardItem.findFirst({ where: { id, user_id: req.user.id } });
        if (!existing) {
            res.status(404).json({ error: 'Item não encontrado' });
            return;
        }
        await prisma_1.prisma.visionBoardItem.delete({ where: { id } });
        res.status(200).json({ message: 'Item removido' });
    }
    catch (err) {
        next(err);
    }
}
