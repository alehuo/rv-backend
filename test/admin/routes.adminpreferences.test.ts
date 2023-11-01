import chai from 'chai';
const expect = chai.expect;
import chaiHttp from 'chai-http';

import { createApp } from '../../src/app';
import knex from '../../src/db/knex';
import * as jwt from '../../src/jwt/token';

chai.use(chaiHttp);

const server = createApp();

const token = jwt.sign(
    {
        userId: 2
    },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin preferences', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('listing preferences', () => {
        it('should return a list of preferences and values', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/preferences')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });

    describe("querying a preference by it's key", () => {
        it('should fail for unknown keys', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/preferences/nonexistent')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });

        it('should return a default value for an undefined preference', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/preferences/globalDefaultMargin')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
            expect(res.body).to.contain.keys('preference');
            expect(res.body.preference).to.contain.all.keys('value', 'key');
            expect(res.body.preference.value).to.equal(0.05);
        });
    });

    describe("setting preference's value", () => {
        it('should fail for unknown keys', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/preferences/nonexistent')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    value: 0.25
                });

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });

        it('should cause queries to resolve with the new value', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/preferences/globalDefaultMargin')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    value: 0.25
                });

            expect(res.status).to.equal(200);

            const post_res = await chai
                .request(server)
                .get('/api/v1/admin/preferences/globalDefaultMargin')
                .set('Authorization', 'Bearer ' + token);

            expect(post_res.status).to.equal(200);
            expect(post_res.body.preference.value).to.equal(0.25);
        });

        it('should fail when setting an invalid value', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/preferences/globalDefaultMargin')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    value: 'asd'
                });

            expect(res.status).to.equal(400);
        });
    });
});
