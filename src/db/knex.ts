const environment = process.env.NODE_ENV || 'development';
import config from '../../knexfile';
const cfg = config[environment];
import knex from 'knex';
export default knex(cfg);
