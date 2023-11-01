import { expect, use, request } from 'chai';
import chaiHttp from 'chai-http';

import { createApp } from '../src/app';
import knex from '../src/db/knex';
import { sign } from '../src/jwt/token';

const server = createApp();
use(chaiHttp);

const token = sign({
    userId: 1
});

describe('routes: categories', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching all categories', () => {
        it('should return all categories', async () => {
            const res = await request(server)
                .get('/api/v1/categories')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });

    describe('Fetching category by id', () => {
        it('should return the category', async () => {
            const res = await request(server)
                .get('/api/v1/categories/21')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });

        it('should return 404 on nonexistent category', async () => {
            const res = await request(server)
                .get('/api/v1/categories/548')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });
    });
});
