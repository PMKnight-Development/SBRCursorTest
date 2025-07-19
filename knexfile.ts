import { Knex } from 'knex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'password',
      database: process.env['DB_NAME'] || 'sbr_cad',
    },
    migrations: {
      directory: './database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './database/seeds',
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'password',
      database: process.env['DB_NAME_TEST'] || 'sbr_cad_test',
    },
    migrations: {
      directory: './database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './database/seeds',
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'password',
      database: process.env['DB_NAME'] || 'sbr_cad',
      ssl: process.env['DB_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './database/seeds',
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default config; 