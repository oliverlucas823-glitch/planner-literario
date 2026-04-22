"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePro = requirePro;
function requirePro(req, res, next) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }
    if (user.subscription_status === 'active') {
        next();
        return;
    }
    if (user.subscription_expires_at &&
        new Date(user.subscription_expires_at) > new Date()) {
        next();
        return;
    }
    res.status(403).json({
        error: 'Funcionalidade exclusiva do plano PRO',
        upgrade_url: '/assinatura',
    });
}
