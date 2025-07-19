"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    environment: process.env['NODE_ENV'] || 'development',
    port: parseInt(process.env['PORT'] || '3000', 10),
    clientPort: parseInt(process.env['CLIENT_PORT'] || '3001', 10),
    database: {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432', 10),
        user: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || 'password',
        name: process.env['DB_NAME'] || 'sbr_cad',
        ssl: process.env['DB_SSL'] === 'true',
    },
    redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
        password: process.env['REDIS_PASSWORD'],
    },
    jwt: {
        secret: process.env['JWT_SECRET'] || 'your-secret-key',
        refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-key',
        expiresIn: process.env['JWT_EXPIRES_IN'] || '1h',
        refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    },
    email: {
        host: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
        port: parseInt(process.env['EMAIL_PORT'] || '587', 10),
        secure: process.env['EMAIL_SECURE'] === 'true',
        user: process.env['EMAIL_USER'],
        password: process.env['EMAIL_PASSWORD'],
        from: process.env['EMAIL_FROM'] || 'noreply@sbr-cad.com',
    },
    active911: {
        apiKey: process.env['ACTIVE911_API_KEY'],
        baseUrl: process.env['ACTIVE911_BASE_URL'] || 'https://api.active911.com',
    },
    arcgis: {
        apiKey: process.env['ARCGIS_API_KEY'],
        baseUrl: process.env['ARCGIS_BASE_URL'] || 'https://services.arcgis.com',
    },
    cors: {
        origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3001'],
        credentials: true,
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
    },
    logging: {
        level: process.env['LOG_LEVEL'] || 'info',
        file: process.env['LOG_FILE'] || 'logs/app.log',
    },
    gps: {
        updateInterval: parseInt(process.env['GPS_UPDATE_INTERVAL'] || '30', 10),
        accuracyThreshold: parseInt(process.env['GPS_ACCURACY_THRESHOLD'] || '50', 10),
    },
    notifications: {
        emailEnabled: process.env['EMAIL_NOTIFICATIONS'] === 'true',
        active911Enabled: process.env['ACTIVE911_NOTIFICATIONS'] === 'true',
        webhookEnabled: process.env['WEBHOOK_NOTIFICATIONS'] === 'true',
        webhookUrl: process.env['WEBHOOK_URL'],
    },
    reports: {
        storagePath: process.env['REPORTS_STORAGE_PATH'] || './reports',
        retentionDays: parseInt(process.env['REPORTS_RETENTION_DAYS'] || '90', 10),
    },
    security: {
        bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
        sessionTimeout: parseInt(process.env['SESSION_TIMEOUT'] || '3600', 10),
    },
    features: {
        realTimeTracking: process.env['REAL_TIME_TRACKING'] !== 'false',
        mapIntegration: process.env['MAP_INTEGRATION'] !== 'false',
        reporting: process.env['REPORTING'] !== 'false',
        notifications: process.env['NOTIFICATIONS'] !== 'false',
    },
};
//# sourceMappingURL=config.js.map