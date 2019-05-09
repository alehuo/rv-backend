process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';
process.env.JWT_ADMIN_SECRET = 'admin test secret';

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const productStore = require('../../src/db/productStore');

describe('routes: admin products', () => {
    const server = require('../../src/app');
    const request = chai.request(server);

    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('products', () => {
        const token = jwt.sign({ username: 'admin_user' }, process.env.JWT_ADMIN_SECRET);

        it('admins should be able to get product list', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token);

            should.exist(res.body.products);
        });

        it('admins should not be able to get a product that does not exist', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/product/9999')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });

        it('admins should be able to get a product that exists', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/product/1816')
                .set('Authorization', 'Bearer ' + token);

            should.exist(res.body.product);
            should.exist(res.body.product.itemid);
            should.exist(res.body.product.pgrpid);
            should.exist(res.body.product.descr);
            should.exist(res.body.product.weight);
            should.exist(res.body.product.priceid);
            should.exist(res.body.product.barcode);
            should.exist(res.body.product.count);
            should.exist(res.body.product.buyprice);
            should.exist(res.body.product.sellprice);
        });

        it('admins should be able to edit a product that exists', async () => {
            const res = await chai
                .request(server)
                .put('/api/v1/admin/products/product/1816')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    descr: 'good product',
                    pgrpid: 3,
                    quantity: 450,
                    buyprice: 120,
                    sellprice: 200,
                    weight: 555
                });

            should.exist(res.body.product);
            should.exist(res.body.product.itemid);
            should.exist(res.body.product.pgrpid);
            should.exist(res.body.product.count);
            should.exist(res.body.product.sellprice);
            should.exist(res.body.product.buyprice);
            should.exist(res.body.product.weight);
            res.body.product.pgrpid.should.equal(3);
            res.body.product.buyprice.should.equal(120);
            res.body.product.sellprice.should.equal(200);
            res.body.product.count.should.equal(450);
            res.body.product.weight.should.equal(555);
        });

        it('Requesting product with existing barcode', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/5029578000972')
                .set('Authorization', 'Bearer ' + token);

            res.status.should.equal(200, 'Existing barcode should return product');
            res.body.product['barcode'].should.equal('5029578000972');
        });

        it('Requesting product with malformated barcode', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/1337')
                .set('Authorization', 'Bearer ' + token);

            res.status.should.equal(404, 'malformated barcode should return error');
        });

        it('Requesting product with nonexisting barcode', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/1234567890123')
                .set('Authorization', 'Bearer ' + token);

            res.status.should.equal(404, 'Barcode that doesn\'t exist should return error');
        });

        it('POST /, returns created product on valid parametres', async () => {
            const product = {
                descr: 'body.descr',
                pgrpid: 21,
                weight: 500,
                barcode: '6411501656247',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token);

            should.exist(res.body.product);
            res.status.should.equal(201);
        });

        it('POST /, returns error on invalid barcode', async () => {
            const product = {
                descr: 'body.descr',
                pgrpid: 21,
                weight: 500,
                barcode: 'invalid',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token);

            res.status.should.equal(400);
        });

        it('POST /, returns error on missing parametres', async () => {
            const product = {
                weight: 500,
                barcode: '4560000033333',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token);

            res.status.should.equal(400);
        });

        it('Adding products to stock should work', async () => {
            const product = await productStore.findById(1750);

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/product/1750')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyprice: 300,
                    sellprice: 350,
                    quantity: 50
                });

            res.status.should.equal(200);
            res.body.product_id.should.equal(1750);
            res.body.buyprice.should.equal(300);
            res.body.sellprice.should.equal(350);
            res.body.quantity.should.equal(product.count + 50);
        });

        it('Adding nonexistent product to stock should not work', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/product/123456890')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyprice: 300,
                    sellprice: 350,
                    quantity: 50
                });

            res.status.should.equal(404);
            should.exist(res.body.error_code);
            should.exist(res.body.message);
        });

        it('Request with missing fields should be rejected', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/product/1750')
                .set('Authorization', 'Bearer ' + token)
                .send({});

            res.status.should.equal(400);
            should.exist(res.body.error_code);
            should.exist(res.body.message);
            should.exist(res.body.errors);
        });
    });
});
