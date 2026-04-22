"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
function errorMiddleware(err, _req, res, _next) {
    console.error('[error]', err);
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({ error: 'Dados inválidos', details: err.issues });
        return;
    }
    const message = process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor'
        : err instanceof Error
            ? err.message
            : 'Erro interno do servidor';
    res.status(500).json({ error: message });
}
