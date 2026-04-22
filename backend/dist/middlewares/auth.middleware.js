"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jwt_1 = require("../lib/jwt");
const prisma_1 = require("../lib/prisma");
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: 'Token não fornecido' });
        return;
    }
    let userId;
    try {
        ;
        ({ userId } = (0, jwt_1.verifyAccessToken)(token));
    }
    catch {
        res.status(401).json({ error: 'Token inválido ou expirado' });
        return;
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
    }
    const { password_hash, password_reset_token, password_reset_expires, ...safeUser } = user;
    void password_hash;
    void password_reset_token;
    void password_reset_expires;
    req.user = safeUser;
    next();
}
