import knex from '../src/db/knex';
import logger from '../src/logger';

async function migrateRollback() {
    logger.info('Rolling back DB migration');
    await knex.migrate.rollback();
    logger.info('Done');
    await knex.destroy();
    process.exit(0);
}

migrateRollback().catch(logger.error);
