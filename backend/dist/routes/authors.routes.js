"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authors_controller_1 = require("../controllers/authors.controller");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
});
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateToken, authors_controller_1.list);
router.post('/', auth_middleware_1.authenticateToken, authors_controller_1.create);
router.put('/:id', auth_middleware_1.authenticateToken, authors_controller_1.update);
router.delete('/:id', auth_middleware_1.authenticateToken, authors_controller_1.remove);
router.post('/:id/photo', auth_middleware_1.authenticateToken, upload.single('photo'), authors_controller_1.uploadPhoto);
exports.default = router;
