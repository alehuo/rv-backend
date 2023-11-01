import chai from 'chai';
const expect = chai.expect;
import chaiHttp from 'chai-http';

import { createApp } from '../../src/app';
import knex from '../../src/db/knex';
import * as jwt from '../../src/jwt/token';
import * as userStore from '../../src/db/userStore';

const server = createApp();

chai.use(chaiHttp);

const token = jwt.sign(
    {
        userId: 2
    },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin users', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching all users', () => {
        it('should return all users', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/users')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });

    describe('Fetching user by id', () => {
        it('should return the user', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/users/1')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });

        it('should error on nonexistent user', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/users/77')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });
    });

    describe('Changing user role', () => {
        it('should change the role', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/users/1/changeRole')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    role: 'ADMIN'
                });

            expect(res.status).to.equal(200);

            const updatedUser = await userStore.findById(1);
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(updatedUser.role).to.equal('ADMIN');
        });

        it('should return the new role', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/users/1/changeRole')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    role: 'ADMIN'
                });

            expect(res.status).to.equal(200);
        });

        it('should error on nonexistent user', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/users/99/changeRole')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    role: 'ADMIN'
                });

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });

        it('should error on invalid role', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/users/1/changeRole')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    role: 'abc'
                });

            expect(res.status).to.equal(400);
        });

        it('should error on invalid parameters', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/users/1/changeRole')
                .set('Authorization', 'Bearer ' + token)
                .send({});

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
        });
    });

    describe("Fetching user's deposit history", async () => {
        it('should return list of deposits', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/users/1/depositHistory')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });

    describe("Fetching user's purchase history", async () => {
        it('should return a list of purchases', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/users/1/purchaseHistory')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });
});
