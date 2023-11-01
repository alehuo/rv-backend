import { Knex } from "knex";

import actions from '../seeddata/ACTION.json';

export const seed = async (knex: Knex) => {
    await knex('ACTION').insert(actions);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"ACTION"', 'actionid'),
            coalesce(max(actionid), 0)
        ) from "ACTION"
    `);
};
