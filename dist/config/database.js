"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const knex_1 = __importDefault(require("knex"));
const config_1 = require("./config");
const dbConfig = {
    client: 'postgresql',
    connection: {
        host: config_1.config.database.host,
        port: config_1.config.database.port,
        user: config_1.config.database.user,
        password: config_1.config.database.password,
        database: config_1.config.database.name,
        ssl: config_1.config.database.ssl ? { rejectUnauthorized: false } : false,
    },
    pool: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
    },
    migrations: {
        directory: '../database/migrations',
        tableName: 'knex_migrations',
    },
    seeds: {
        directory: '../database/seeds',
    },
    debug: config_1.config.environment === 'development',
};
exports.db = (0, knex_1.default)(dbConfig);
exports.default = exports.db;
//# sourceMappingURL=database.js.map