"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const books_routes_1 = __importDefault(require("./routes/books.routes"));
const reading_days_routes_1 = __importDefault(require("./routes/reading-days.routes"));
const challenges_routes_1 = __importDefault(require("./routes/challenges.routes"));
const vision_board_routes_1 = __importDefault(require("./routes/vision-board.routes"));
const authors_routes_1 = __importDefault(require("./routes/authors.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const stripe_routes_1 = __importDefault(require("./routes/stripe.routes"));
const stripe_controller_1 = require("./controllers/stripe.controller");
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
// Stripe webhook must receive the raw body — registered before express.json()
app.post('/api/stripe/webhook', express_1.default.raw({ type: 'application/json' }), stripe_controller_1.webhook);
app.use(express_1.default.json());
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/books', books_routes_1.default);
app.use('/api/reading-days', reading_days_routes_1.default);
app.use('/api/challenges', challenges_routes_1.default);
app.use('/api/vision-board', vision_board_routes_1.default);
app.use('/api/authors', authors_routes_1.default);
app.use('/api/stats', stats_routes_1.default);
app.use('/api/stripe', stripe_routes_1.default);
app.use(error_middleware_1.errorMiddleware);
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
