exports.up = async (knex: any) => {
    if (!(await knex.schema.hasTable('PREFERENCES'))) {
        await knex.schema.createTable('PREFERENCES', (table: any) => {
            table.string('key').notNullable().index().comment('Textual identifier of the preference.');

            table
                .string('value')
                .notNullable()
                .comment('Value of the preference, serialized to text. Format depends on the preference.');
        });
    }
};

exports.down = async (knex: any) => {
    if (process.env.NODE_ENV !== 'production') {
        await knex.schema.dropTableIfExists('PREFERENCES');
    } else {
        throw new Error("don't drop stuff in production");
    }
};
