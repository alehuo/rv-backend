import chai from 'chai';
const expect = chai.expect;
import chaiHttp from 'chai-http';

import { createApp } from '../../src/app';
import knex from '../../src/db/knex';
import * as jwt from '../../src/jwt/token';
import * as userStore from '../../src/db/userStore';

const server = createApp();
chai.use(chaiHttp);

describe('routes: admin authentication', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Admin authentication', () => {
        it('logging in with admin role should work', async () => {
            const res = await chai.request(server).post('/api/v1/admin/authenticate').send({
                username: 'admin_user',
                password: 'admin123'
            });

            expect(res.status).to.equal(200);

            const decoded = jwt.verify(res.body.accessToken, process.env.JWT_ADMIN_SECRET);
            // @ts-expect-error TS(2531) FIXME: Object is possibly 'null'.
            expect(decoded.data.userId).to.exist;

            const user = await userStore.findByUsername('admin_user');
            // @ts-expect-error TS(2531) FIXME: Object is possibly 'null'.
            expect(decoded.data.userId).to.equal(user.userId);
        });

        it('admin tokens should not be signed with the same key as user tokens', async () => {
            const res = await chai.request(server).post('/api/v1/admin/authenticate').send({
                username: 'admin_user',
                password: 'admin123'
            });

            const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
            expect(decoded).to.equal(null);
        });

        it('only admins should be able to authenticate', async () => {
            const res = await chai.request(server).post('/api/v1/admin/authenticate').send({
                username: 'normal_user',
                password: 'hunter2'
            });

            expect(res.status).to.equal(403);
        });
    });
});
