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

describe('routes: userPurchaseHistory', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching user purchase history', () => {
        it('should return user purchase history', async () => {
            const res = await request(server)
                .get('/api/v1/user/purchaseHistory')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });

    describe('Fetching single purchase by id', () => {
        it('should return the purchase event', async () => {
            const res = await request(server)
                .get('/api/v1/user/purchaseHistory/2')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });

        it('should return 404 on nonexistent purchase event', async () => {
            const res = await request(server)
                .get('/api/v1/user/purchaseHistory/8319')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });
    });
});
