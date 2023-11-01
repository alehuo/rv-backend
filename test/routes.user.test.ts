import { expect, use, request } from 'chai';
import chaiHttp from 'chai-http';

import { createApp } from '../src/app';
import knex from '../src/db/knex';
import { sign } from '../src/jwt/token';
import { findById, findByUsername, verifyPassword } from '../src/db/userStore';
import { getUserDepositHistory } from '../src/db/historyStore';

const server = createApp();
use(chaiHttp);

const token = sign({
    userId: 1
});

describe('routes: user', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching user info', () => {
        it('should return user info', async () => {
            const res = await request(server)
                .get('/api/v1/user')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });

    describe('Modifying user info', () => {
        it('should modify user', async () => {
            const res = await request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    username: 'abcd',
                    fullName: 'abcd efgh',
                    email: 'abc@def.ghi'
                });

            expect(res.status).to.equal(200);

            expect(res.body.user.username).to.equal('abcd');
            expect(res.body.user.fullName).to.equal('abcd efgh');
            expect(res.body.user.email).to.equal('abc@def.ghi');

            const user = await findById(1);

            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(user.username).to.equal('abcd');
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(user.fullName).to.equal('abcd efgh');
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(user.email).to.equal('abc@def.ghi');
        });

        it('should allow modifying only some fields', async () => {
            const res = await request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    email: 'abc@def.ghi'
                });

            expect(res.status).to.equal(200);

            expect(res.body.user.username).to.equal('normal_user');
            expect(res.body.user.fullName).to.equal('John Doe');
            expect(res.body.user.email).to.equal('abc@def.ghi');
        });

        it('should deny changing username to one already taken', async () => {
            const res = await request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    username: 'admin_user'
                });

            expect(res.status).to.equal(409);
        });

        it('should deny changing email to one already taken', async () => {
            const res = await request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    email: 'admin@example.com'
                });

            expect(res.status).to.equal(409);
        });

        it('should error if no fields are specified', async () => {
            const res = await request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({});

            expect(res.status).to.equal(400);
        });
    });

    describe('Depositing money', () => {
        it('should increase account balance', async () => {
            const res = await request(server)
                .post('/api/v1/user/deposit')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    amount: 150
                });

            expect(res.status).to.equal(200);

            expect(res.body.accountBalance).to.equal(650);

            const user = await findById(1);

            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(user.moneyBalance).to.equal(650);
        });

        it('should create an event into deposit history', async () => {
            const user = await findByUsername('normal_user');
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            const oldDepositHistory = await getUserDepositHistory(user.userId);

            const res = await request(server)
                .post('/api/v1/user/deposit')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    amount: 2371
                });

            expect(res.status).to.equal(200);

            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            const newDepositHistory = await getUserDepositHistory(user.userId);

            expect(newDepositHistory.length).to.equal(oldDepositHistory.length + 1);

            const depositEvent = newDepositHistory[0];

            expect(depositEvent.amount).to.equal(2371);
            expect(depositEvent.balanceAfter).to.equal(res.body.accountBalance);
        });

        it('should error on depositing a negative amount', async () => {
            const res = await request(server)
                .post('/api/v1/user/deposit')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    amount: -200
                });

            expect(res.status).to.equal(400);
        });
    });

    describe('Changing password', () => {
        it('should change the password', async () => {
            const res = await request(server)
                .post('/api/v1/user/changePassword')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    password: 'abcdefg'
                });

            expect(res.status).to.equal(204);

            const user = await findById(1);
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            const passwordMatches = await verifyPassword('abcdefg', user.passwordHash);

            expect(passwordMatches).to.be.true;
        });
    });
});
