"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config/config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const calls_1 = __importDefault(require("./routes/calls"));
const units_1 = __importDefault(require("./routes/units"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const reports_1 = __importDefault(require("./routes/reports"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const protocol_1 = __importDefault(require("./routes/protocol"));
const arcgis_1 = __importDefault(require("./routes/arcgis"));
const websocket_1 = require("./websocket");
const database_1 = require("../config/database");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
app.set('trust proxy', 1);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: config_1.config.cors.origin,
        credentials: true,
    },
});
exports.io = io;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
const limiter = (0, express_rate_limit_1.default)(config_1.config.rateLimit);
app.use('/api/', limiter);
app.use((0, cors_1.default)(config_1.config.cors));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (config_1.config.environment === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../client/build')));
}
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config_1.config.environment,
        version: process.env['npm_package_version'] || '1.0.0',
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/calls', calls_1.default);
app.use('/api/units', units_1.default);
app.use('/api/users', users_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/protocol', protocol_1.default);
app.use('/api/arcgis', arcgis_1.default);
if (config_1.config.environment === 'production') {
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../../client/build/index.html'));
    });
}
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
(0, websocket_1.setupWebSocket)(server);
async function testDatabaseConnection() {
    try {
        await database_1.db.raw('SELECT 1');
        logger_1.logger.info('Database connection established successfully');
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        process.exit(1);
    }
}
async function gracefulShutdown(signal) {
    logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
    try {
        await database_1.db.destroy();
        logger_1.logger.info('Database connections closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connections:', error);
    }
    process.exit(0);
}
async function startServer() {
    try {
        await testDatabaseConnection();
        server.listen(config_1.config.port, () => {
            logger_1.logger.info(`SBR CAD Server running on port ${config_1.config.port}`);
            logger_1.logger.info(`Environment: ${config_1.config.environment}`);
            logger_1.logger.info(`Client URL: http://localhost:${config_1.config.clientPort}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
startServer();
//# sourceMappingURL=index.js.map