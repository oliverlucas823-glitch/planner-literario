"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? '';
function generateAccessToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
}
function generateRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
function verifyAccessToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    if (typeof payload === 'string' || !('userId' in payload)) {
        throw new Error('Token inválido');
    }
    return { userId: payload.userId };
}
function verifyRefreshToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    if (typeof payload === 'string' || !('userId' in payload)) {
        throw new Error('Token inválido');
    }
    return { userId: payload.userId };
}
