exports.up = async (knex: any) => {
    await knex.raw('ALTER TABLE "RVITEM" RENAME TO "RVITEM_ALL"');

    await knex.schema.table('RVITEM_ALL', (table: any) => {
        table.boolean('deleted').notNull().defaultTo(false);
    });

    await knex.raw('CREATE VIEW "RVITEM" AS SELECT * FROM "RVITEM_ALL" WHERE deleted IS FALSE');
};

exports.down = async (knex: any) => {
    await knex.raw('DROP VIEW "RVITEM"');

    await knex.schema.table('RVITEM_ALL', (table: any) => {
        table.dropColumn('deleted');
    });

    await knex.raw('ALTER TABLE "RVITEM_ALL" RENAME TO "RVITEM"');
};
