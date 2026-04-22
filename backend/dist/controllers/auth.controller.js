"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.me = me;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const resend_1 = require("../lib/resend");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const refreshSchema = zod_1.z.object({
    refresh_token: zod_1.z.string(),
});
const forgotSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8),
});
function safeUser(user) {
    return { id: user.id, email: user.email, name: user.name, subscription_status: user.subscription_status };
}
async function register(req, res, next) {
    try {
        const { email, password, name } = registerSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email já cadastrado' });
            return;
        }
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { email, password_hash, name },
        });
        const access_token = (0, jwt_1.generateAccessToken)(user.id);
        const refresh_token = (0, jwt_1.generateRefreshToken)(user.id);
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: refresh_token,
                user_id: user.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        void (0, resend_1.sendWelcomeEmail)(email, name);
        res.status(201).json({ user: safeUser(user), access_token, refresh_token });
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!valid) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { user_id: user.id, expires_at: { lt: new Date() } },
        });
        const access_token = (0, jwt_1.generateAccessToken)(user.id);
        const refresh_token = (0, jwt_1.generateRefreshToken)(user.id);
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: refresh_token,
                user_id: user.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        res.status(200).json({ user: safeUser(user), access_token, refresh_token });
    }
    catch (err) {
        next(err);
    }
}
async function refresh(req, res, next) {
    try {
        const { refresh_token } = refreshSchema.parse(req.body);
        let userId;
        try {
            ;
            ({ userId } = (0, jwt_1.verifyRefreshToken)(refresh_token));
        }
        catch {
            res.status(401).json({ error: 'Refresh token inválido' });
            return;
        }
        const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { token: refresh_token } });
        if (!stored || stored.expires_at < new Date()) {
            res.status(401).json({ error: 'Refresh token inválido' });
            return;
        }
        await prisma_1.prisma.refreshToken.delete({ where: { token: refresh_token } });
        const access_token = (0, jwt_1.generateAccessToken)(userId);
        const new_refresh_token = (0, jwt_1.generateRefreshToken)(userId);
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: new_refresh_token,
                user_id: userId,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        res.status(200).json({ access_token, refresh_token: new_refresh_token });
    }
    catch (err) {
        next(err);
    }
}
async function logout(req, res, next) {
    try {
        const { refresh_token } = refreshSchema.parse(req.body);
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token: refresh_token } });
        res.status(200).json({ message: 'Logout realizado com sucesso' });
    }
    catch (err) {
        next(err);
    }
}
async function forgotPassword(req, res, next) {
    try {
        const { email } = forgotSchema.parse(req.body);
        const SAFE_RESPONSE = { message: 'Se o email existir, você receberá as instruções' };
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(200).json(SAFE_RESPONSE);
            return;
        }
        const rawToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password_reset_token: hashedToken,
                password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        const resetLink = `${process.env.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
        await (0, resend_1.sendPasswordResetEmail)(email, resetLink);
        res.status(200).json(SAFE_RESPONSE);
    }
    catch (err) {
        next(err);
    }
}
async function resetPassword(req, res, next) {
    try {
        const { token, password } = resetSchema.parse(req.body);
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                password_reset_token: hashedToken,
                password_reset_expires: { gt: new Date() },
            },
        });
        if (!user) {
            res.status(400).json({ error: 'Token inválido ou expirado' });
            return;
        }
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash,
                password_reset_token: null,
                password_reset_expires: null,
            },
        });
        await prisma_1.prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
        res.status(200).json({ message: 'Senha redefinida com sucesso' });
    }
    catch (err) {
        next(err);
    }
}
async function me(req, res, next) {
    try {
        res.status(200).json({ user: req.user });
    }
    catch (err) {
        next(err);
    }
}
