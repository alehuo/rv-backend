import knex from '../src/db/knex';
import logger from '../src/logger';

async function seed() {
    logger.info('Seeding db');
    await knex.seed.run();
    logger.info('Done');
    await knex.destroy();
    process.exit(0);
}

seed().catch(logger.error);
