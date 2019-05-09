const knex = require('./knex');

/**
 * Finds a product by its barcode.
 *
 * @param {string} barcode barcode of the product
 * @returns product and price information if found, null otherwise
 */
module.exports.findByBarcode = async (barcode) => {
    return await knex('PRICE')
        .leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .select(
            'RVITEM.itemid',
            'RVITEM.descr',
            'RVITEM.pgrpid',
            'PRODGROUP.descr as pgrpdescr',
            'RVITEM.weight',
            'PRICE.priceid',
            'PRICE.barcode',
            'PRICE.buyprice',
            'PRICE.sellprice',
            'PRICE.count'
        )
        .where('PRICE.barcode', barcode)
        .andWhere('PRICE.endtime', null)
        .first();
};

/**
 * Finds a product by its id.
 *
 * @param {*} id id of the product
 * @returns product and price information if found, null otherwise
 */
module.exports.findById = async (id) => {
    return await knex('RVITEM')
        .leftJoin('PRICE', (builder) => {
            builder.on('PRICE.itemid', '=', 'RVITEM.itemid').andOnNull('PRICE.endtime');
        })
        .where('RVITEM.itemid', id)
        .first();
};

/**
 * Changes a product's stock and price information. If the product's
 * price changes, a new price will be created and old price will be
 * invalidated. Actions are recorded in product history.
 *
 * @param {*} id product id
 * @param {*} buyprice buy price
 * @param {*} sellprice sell price
 * @param {*} quantity quantity
 * @param {*} userid id of the user doing the change
 */
module.exports.changeProductStock = async (productid, buyprice, sellprice, quantity, userid) => {
    await knex.transaction(async (trx) => {
        const rows = await knex
            .select('*')
            .transacting(trx)
            .from('PRICE')
            .where('PRICE.itemid', productid)
            .andWhere('PRICE.endtime', null);
        const oldPrice = rows[0];
        let id;

        // update current valid price if only quantity changes
        if (oldPrice.buyprice == buyprice && oldPrice.sellprice == sellprice) {
            await knex('PRICE')
                .transacting(trx)
                .update('count', quantity)
                .where('priceid', oldPrice.priceid);
            const newPriceId = oldPrice.priceid;
            oldPrice.priceid = null;

            id = [newPriceId];
        } else {
            // otherwise invalidate old price and create a new price
            await knex('PRICE')
                .transacting(trx)
                .update({
                    endtime: new Date(),
                    count: 0
                })
                .where('itemid', productid)
                .andWhere('endtime', null);
            id = await knex('PRICE')
                .transacting(trx)
                .insert(
                    {
                        itemid: productid,
                        barcode: oldPrice.barcode,
                        count: quantity,
                        buyprice,
                        sellprice,
                        userid,
                        starttime: new Date()
                    },
                    'priceid'
                );
        }

        // record changes in product history
        const newPriceId = id[0];
        const actions = [];
        const timestamp = new Date();

        if (buyprice !== oldPrice.buyprice) {
            actions.push({
                time: timestamp,
                count: quantity,
                itemid: productid,
                userid: userid,
                actionid: 6,
                priceid1: newPriceId,
                priceid2: oldPrice.priceid
            });
        }

        if (sellprice !== oldPrice.sellprice) {
            actions.push({
                time: timestamp,
                count: quantity,
                itemid: productid,
                userid: userid,
                actionid: 7,
                priceid1: newPriceId,
                priceid2: oldPrice.priceid
            });
        }

        if (quantity !== oldPrice.count) {
            actions.push({
                time: timestamp,
                count: quantity,
                itemid: productid,
                userid: userid,
                actionid: 8,
                priceid1: newPriceId,
                priceid2: oldPrice.priceid
            });
        }

        if (actions.length > 0) {
            await knex('ITEMHISTORY')
                .transacting(trx)
                .insert(actions);
        }
    });
};

/**
 * Records a product purchase in the database.
 *
 * @param {integer} productid id of the product that is purchased
 * @param {integer} priceid price id of the product
 * @param {integer} userid id of the user who is purchasing this product
 * @param {integer} count how many products are purchased
 * @param {integer} price price of a single product
 * @param {integer} stockBefore product stock before purchasing
 * @param {integer} balanceBefore user balance before purchasing
 */
module.exports.recordPurchase = async (productid, priceid, userid, count, price, stockBefore, balanceBefore) => {
    await knex.transaction(async (trx) => {
        const now = new Date();
        let stock = stockBefore;
        let balance = balanceBefore;

        /* Storing multibuy into history as multiple individual history events. */
        for (let i = 0; i < count; i++) {
            stock--;
            balance -= price;

            const saldhistids = await knex('SALDOHISTORY')
                .transacting(trx)
                .insert({
                    userid: userid,
                    time: now,
                    saldo: balance,
                    difference: -price
                })
                .returning('saldhistid');
            await knex('ITEMHISTORY')
                .transacting(trx)
                .insert({
                    time: now,
                    count: stock,
                    actionid: 5,
                    itemid: productid,
                    userid: userid,
                    priceid1: priceid,
                    saldhistid: saldhistids[0]
                });
        }

        await knex('PRICE')
            .transacting(trx)
            .where({ priceid: priceid })
            .update({ count: stock });
        await knex('RVPERSON')
            .transacting(trx)
            .where({ userid: userid })
            .update({ saldo: balance });
    });
};

/**
 * Returns all products and their stock quantities, if available.
 *
 */
module.exports.findAll = async () => {
    return await knex('RVITEM')
        .leftJoin('PRICE', 'RVITEM.itemid', 'PRICE.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .select(
            'RVITEM.itemid',
            'RVITEM.descr',
            'RVITEM.pgrpid',
            'PRODGROUP.descr as pgrpdescr',
            'RVITEM.weight',
            'PRICE.barcode',
            'PRICE.buyprice',
            'PRICE.sellprice',
            'PRICE.count'
        )
        .where('PRICE.endtime', null);
};

/**
 * Creates a new product if given barcode is not in use.
 *
 */
module.exports.addProduct = async (product, price, userid) => {
    return await knex.transaction(async (trx) => {
        const itemids = await knex('RVITEM')
            .transacting(trx)
            .insert(product)
            .returning('itemid');
        price.itemid = itemids[0];
        const priceids = await knex('PRICE')
            .transacting(trx)
            .insert(price)
            .returning('priceid');
        await knex('ITEMHISTORY')
            .transacting(trx)
            .insert({
                time: price.starttime,
                count: price.count,
                itemid: price.itemid,
                userid: userid,
                actionid: 1,
                priceid1: priceids[0]
            });
        return itemids[0];
    });
};

/**
 * Updates a product's information (name, category, weight)
 *
 * @param {Object} product product to update
 * @param {integer} id product id
 * @param {string} name product name
 * @param {integer} group product category id
 * @param {weight} weight product weight
 * @param {integer} userid id of the user updating the product
 */
module.exports.updateProduct = async ({ id, name, group, weight, userid }) => {
    const oldProduct = await module.exports.findById(id);

    await knex.transaction(async (trx) => {
        await knex('RVITEM')
            .transacting(trx)
            .update({
                descr: name,
                pgrpid: group,
                weight
            })
            .where('itemid', id);
        // record changes in product history
        const actions = [];
        const action = {
            time: new Date(),
            count: oldProduct.count,
            itemid: id,
            userid,
            priceid1: oldProduct.priceid
        };
        if (name !== oldProduct.descr) {
            actions.push(Object.assign({}, action, { actionid: 2 }));
        }
        if (group !== oldProduct.pgrpid) {
            actions.push(Object.assign({}, action, { actionid: 4 }));
        }
        if (weight !== oldProduct.weight) {
            actions.push(Object.assign({}, action, { actionid: 3 }));
        }
        if (actions.length > 0) {
            await knex('ITEMHISTORY')
                .transacting(trx)
                .insert(actions);
        }
    });
};
