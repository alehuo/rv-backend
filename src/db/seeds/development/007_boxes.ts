import { Knex } from 'knex';
import boxes from '../seeddata/RVBOX.json';

export const seed = async (knex: Knex) => {
    await knex('RVBOX').insert(boxes);
};
