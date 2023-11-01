import { Knex } from 'knex';

const config: Record<string, Knex.Config<any>> = {
    development: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME + '_dev',
            port: parseInt(process.env.DB_PORT || '5432', 10)
        },
        migrations: {
            directory: __dirname + '/src/db/migrations'
        },
        seeds: {
            directory: __dirname + '/src/db/seeds/development'
        }
    },

    test: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME + '_test',
            port: parseInt(process.env.DB_PORT || '5432', 10)
        },
        migrations: {
            directory: __dirname + '/src/db/migrations'
        },
        seeds: {
            directory: __dirname + '/src/db/seeds/test'
        }
    },

    production: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '5432', 10)
        },
        migrations: {
            directory: __dirname + '/src/db/migrations'
        },
        seeds: {
            directory: __dirname + '/src/db/seeds/production'
        }
    }
};

export default config;
