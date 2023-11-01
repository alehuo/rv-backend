import { expect, use, request } from 'chai';
import chaiHttp from 'chai-http';

import { createApp } from '../src/app';
import knex from '../src/db/knex';
import { sign } from '../src/jwt/token';
import { findByUsername, updateUser } from '../src/db/userStore';
import { findByBarcode } from '../src/db/productStore';
import { getUserPurchaseHistory } from '../src/db/historyStore';

const server = createApp();
use(chaiHttp);

const token = sign({
    userId: 1
});

describe('routes: products', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching all products', () => {
        it('should return all products', async () => {
            const res = await request(server)
                .get('/api/v1/products')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });
    });

    describe('Fetching product by barcode', () => {
        it('should return the product', async () => {
            const res = await request(server)
                .get('/api/v1/products/5053990127443')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });

        it('should return 404 on nonexistent product', async () => {
            const res = await request(server)
                .get('/api/v1/products/99999995')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });
    });

    describe('Purchasing product', () => {
        it('should deduct account balance and product stock', async () => {
            const oldUser = await findByUsername('normal_user');
            const oldProduct = await findByBarcode('8855702006834');

            const res = await request(server)
                .post('/api/v1/products/8855702006834/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.status).to.equal(200);

            const newUser = await findByUsername('normal_user');
            const newProduct = await findByBarcode('8855702006834');

            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(newUser.moneyBalance).to.equal(oldUser.moneyBalance - oldProduct.sellPrice);
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(newUser.moneyBalance).to.equal(res.body.accountBalance);

            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(newProduct.stock).to.equal(oldProduct.stock - 1);
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            expect(newProduct.stock).to.equal(res.body.productStock);
        });

        it('should create an event into purchase history', async () => {
            const user = await findByUsername('normal_user');
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            const oldPurchaseHistory = await getUserPurchaseHistory(user.userId);

            const res = await request(server)
                .post('/api/v1/products/6417901011105/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.status).to.equal(200);

            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            const newPurchaseHistory = await getUserPurchaseHistory(user.userId);

            expect(newPurchaseHistory.length).to.equal(oldPurchaseHistory.length + 1);
            expect(res.body.purchases.length).to.equal(1);

            const purchaseEvent = newPurchaseHistory[0];

            expect(purchaseEvent.product.barcode).to.equal('6417901011105');
            expect(purchaseEvent.balanceAfter).to.equal(res.body.accountBalance);
            expect(purchaseEvent.stockAfter).to.equal(res.body.productStock);
        });

        it('should create multiple history events on multibuy', async () => {
            const user = await findByUsername('normal_user');
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            const oldPurchaseHistory = await getUserPurchaseHistory(user.userId);

            const res = await request(server)
                .post('/api/v1/products/6417901011105/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 3
                });

            expect(res.status).to.equal(200);

            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            const newPurchaseHistory = await getUserPurchaseHistory(user.userId);

            expect(newPurchaseHistory.length).to.equal(oldPurchaseHistory.length + 3);
            expect(res.body.purchases.length).to.equal(3);
        });

        it('should return 404 on nonexistent product', async () => {
            const res = await request(server)
                .post('/api/v1/products/1234567890123/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.status).to.equal(404);
        });

        it('should error on insufficient funds', async () => {
            const user = await findByUsername('normal_user');
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            await updateUser(user.userId, { moneyBalance: 0 });

            const res = await request(server)
                .post('/api/v1/products/8855702006834/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.body.error_code).to.equal('insufficient_funds');
        });
    });
});
