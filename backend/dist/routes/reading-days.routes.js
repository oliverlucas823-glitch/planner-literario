"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const reading_days_controller_1 = require("../controllers/reading-days.controller");
const router = (0, express_1.Router)();
// /streak must be registered before /:id to avoid param conflict
router.get('/streak', auth_middleware_1.authenticateToken, reading_days_controller_1.getStreak);
router.get('/', auth_middleware_1.authenticateToken, reading_days_controller_1.list);
router.post('/', auth_middleware_1.authenticateToken, reading_days_controller_1.create);
router.delete('/:id', auth_middleware_1.authenticateToken, reading_days_controller_1.remove);
exports.default = router;
