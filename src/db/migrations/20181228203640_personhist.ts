exports.up = async (knex: any) => {
    if (!(await knex.schema.hasTable('PERSONHIST'))) {
        await knex.schema.createTable('PERSONHIST', (table: any) => {
            table.increments('pershistid').primary();
            table.dateTime('time').notNullable().index();
            table.string('ipaddress').defaultTo(null);
            table.integer('actionid').notNullable().references('actionid').inTable('ACTION');
            table.integer('userid1').notNullable().references('userid').inTable('RVPERSON');
            table.integer('userid2').notNullable().references('userid').inTable('RVPERSON');
        });
    }
};

exports.down = async (knex: any) => {
    if (process.env.NODE_ENV !== 'production') {
        await knex.schema.dropTableIfExists('PERSONHIST');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
