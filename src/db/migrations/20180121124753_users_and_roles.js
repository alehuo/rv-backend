exports.up = function(knex, Promise) {
    return knex.schema
        .hasTable('ROLE')
        .then((exists) => {
            if (!exists) {
                return knex.schema.createTable('ROLE', (table) => {
                    table.increments('roleid');
                    table.string('role', 32).notNullable();
                    table
                        .integer('buzzerlimit')
                        .notNullable()
                        .defaultTo(-1000);
                    table
                        .integer('fgcolor')
                        .notNullable()
                        .defaultTo(37);
                    table
                        .integer('bgcolor')
                        .notNullable()
                        .defaultTo(40);
                });
            }
        })
        .then(() => {
            return knex.schema.hasTable('RVPERSON').then((exists) => {
                if (!exists) {
                    return knex.schema.createTable('RVPERSON', (table) => {
                        table.integer('userid').primary();
                        table.dateTime('createdate').notNullable();
                        table
                            .integer('roleid')
                            .notNullable()
                            .references('roleid')
                            .inTable('ROLE');
                        table
                            .string('name', 64)
                            .notNullable()
                            .index();
                        table.string('univident', 128).notNullable();
                        table.string('pass', 100).notNullable();
                        table.integer('saldo').notNullable();
                        table.string('realname', 128);
                        table.unique('name');
                        table.unique('univident');
                    });
                }
            });
        })
        .then(() => {
            return knex.schema.hasTable('SALDOHISTORY').then((exists) => {
                if (!exists) {
                    return knex.schema.createTable('SALDOHISTORY', (table) => {
                        table.increments('saldhistid');
                        table
                            .integer('userid')
                            .notNullable()
                            .references('userid')
                            .inTable('RVPERSON')
                            .index();
                        table
                            .dateTime('time')
                            .notNullable()
                            .index();
                        table.integer('saldo').index();
                        table.integer('difference').notNullable();
                    });
                }
            });
        });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('dont drop stuff in production');
    } else {
        return knex.schema
            .dropTableIfExists('SALDOHISTORY')
            .dropTableIfExists('RVPERSON')
            .dropTableIfExists('ROLE');
    }
};
