import { Knex } from 'knex';

import prices from '../seeddata/PRICE';

export const seed = async (knex: Knex) => {
    await knex('PRICE').insert(prices);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"PRICE"', 'priceid'),
            coalesce(max(priceid), 0)
        ) from "PRICE"
    `);
};
