import { createApp } from './app';
import logger from './logger';
import knex from './db/knex';

const PORT = process.env.PORT;
if (PORT === undefined) {
    logger.error('Port is undefined');
    process.exit(1);
}
const app = createApp();
app.listen(PORT, async () => {
    try {
        await knex.raw('SELECT 1');
        logger.info('rv-backend started at port ' + PORT);
    } catch (err) {
        if (err instanceof Error) {
            logger.error(err.message);
        } else {
            logger.error(err);
        }
        process.exit(1);
    }
});
