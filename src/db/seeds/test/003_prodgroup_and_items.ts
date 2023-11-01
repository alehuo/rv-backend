import { Knex } from 'knex';
import prodgroups from '../seeddata/PRODGROUP.json';
import rvitems from '../seeddata/RVITEM.json';

export const seed = async (knex: Knex) => {
    await knex('PRODGROUP_ALL').insert(prodgroups);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"PRODGROUP_ALL"', 'pgrpid'),
            coalesce(max(pgrpid), 0)
        ) from "PRODGROUP_ALL"
    `);
    await knex('RVITEM').insert(rvitems);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"RVITEM"', 'itemid'),
            coalesce(max(itemid), 0)
        ) from "RVITEM"
    `);
};
