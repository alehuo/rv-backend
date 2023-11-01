import knex from '../src/db/knex';
import logger from '../src/logger';

async function migrateLatest() {
    logger.info('Migrating DB');
    await knex.migrate.latest();
    logger.info('Done');
    await knex.destroy();
    process.exit(0);
}

migrateLatest().catch(logger.error);
