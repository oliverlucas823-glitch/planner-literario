"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resend = void 0;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const resend_1 = require("resend");
const apiKey = process.env.RESEND_API_KEY || 're_placeholder';
exports.resend = apiKey !== 're_placeholder'
    ? new resend_1.Resend(apiKey)
    : null;
async function sendWelcomeEmail(email, name) {
    if (!exports.resend)
        return;
    try {
        await exports.resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Bem-vindo ao Planner Literário 📚',
            html: `<h1>Olá, ${name}!</h1><p>Bem-vindo ao Planner Literário. Acesse: ${process.env.FRONTEND_URL}</p>`
        });
    }
    catch (err) {
        console.error('Erro ao enviar email de boas-vindas:', err);
    }
}
async function sendPasswordResetEmail(email, resetLink) {
    if (!exports.resend)
        return;
    try {
        await exports.resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Redefinição de senha — Planner Literário',
            html: `<p>Clique no link para redefinir sua senha (expira em 1 hora):</p><a href="${resetLink}">${resetLink}</a>`
        });
    }
    catch (err) {
        console.error('Erro ao enviar email de reset:', err);
    }
}
