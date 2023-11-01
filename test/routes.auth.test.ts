import { expect, use, request } from 'chai';
import chaiHttp from 'chai-http';

import { createApp } from '../src/app';
import knex from '../src/db/knex';
import { verify } from '../src/jwt/token';
import { findByUsername } from '../src/db/userStore';

const server = createApp();
use(chaiHttp);

describe('routes: authentication', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('User authentication', () => {
        it('with valid credentials, should respond with an authentication token', async () => {
            const res = await request(server).post('/api/v1/authenticate').send({
                username: 'normal_user',
                password: 'hunter2'
            });

            expect(res.status).to.equal(200);

            const token = verify(res.body.accessToken);
            // @ts-expect-error TS(2531) FIXME: Object is possibly 'null'.
            expect(token.data.userId).to.exist;

            const user = await findByUsername('normal_user');
            // @ts-expect-error TS(2531) FIXME: Object is possibly 'null'.
            expect(token.data.userId).to.equal(user.userId);
        });

        it('with invalid password, should return a 401 unauthorized response', async () => {
            const res = await request(server).post('/api/v1/authenticate').send({
                username: 'normal_user',
                password: 'incorrect'
            });

            expect(res.status).to.equal(401);
        });

        it('with nonexistent user, should return a 401 unauthorized response', async () => {
            const res = await request(server).post('/api/v1/authenticate').send({
                username: 'nobody',
                password: 'something'
            });

            expect(res.status).to.equal(401);
        });

        it('invalid request should result in a 400 bad request response', async () => {
            const res = await request(server).post('/api/v1/authenticate').send({
                garbage: 'garbage'
            });

            expect(res.status).to.equal(400);
        });
    });
});
