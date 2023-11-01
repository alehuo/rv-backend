import express from 'express';
const router = express.Router();
import authMiddleware from '../authMiddleware';
import * as productStore from '../../db/productStore';
import * as categoryStore from '../../db/categoryStore';
import logger from './../../logger';
import { deleteUndefinedFields } from '../../utils/objectUtils';
import * as historyStore from '../../db/historyStore';

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.param('barcode', async (req: any, res: any, next: any) => {
    const product = await productStore.findByBarcode(req.params.barcode);

    if (product === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No product with barcode '${req.params.barcode}' found`
        });

        logger.error('User %s tried to access unknown product %s as admin', req.user.username, req.params.barcode);

        return;
    }

    req.product = product;

    next();
});

router.get('/', async (req: any, res: any) => {
    const user = req.user;

    try {
        const products = await productStore.getProducts();
        const mappedProds = products.map((product: any) => {
            return {
                barcode: product.barcode,
                name: product.name,
                category: {
                    categoryId: product.category.categoryId,
                    description: product.category.description
                },
                weight: product.weight,
                buyPrice: product.buyPrice,
                sellPrice: product.sellPrice,
                stock: product.stock
            };
        });

        logger.info('User %s fetched products as admin', user.username);
        res.status(200).json({
            products: mappedProds
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.post('/', async (req: any, res: any) => {
    const user = req.user;
    const { barcode, name, categoryId, weight, buyPrice, sellPrice, stock } = req.body;

    /* Checking if product already exists. */
    const existingProduct = await productStore.findByBarcode(barcode);
    if (existingProduct) {
        logger.error('User %s failed to create new product, barcode %s was already taken', user.username, barcode);
        res.status(409).json({
            error_code: 'identifier_taken',
            message: 'Barcode already in use.'
        });
        return;
    }

    /* Checking if category exists. */
    const existingCategory = await categoryStore.findById(categoryId);
    if (!existingCategory) {
        logger.error('User %s tried to create product of unknown category %s', user.username, categoryId);
        res.status(400).json({
            error_code: 'invalid_reference',
            message: 'Referenced category not found.'
        });
        return;
    }

    const newProduct = await productStore.insertProduct(
        {
            barcode,
            name,
            categoryId,
            weight,
            buyPrice,
            sellPrice,
            stock
        },
        user.userId
    );

    logger.info(
        'User %s created new product with data {barcode: %s, name: %s, categoryId: %s, weight: %s, buyPrice: %s, sellPrice: %s, stock: %s}',
        user.username,
        barcode,
        name,
        categoryId,
        weight,
        buyPrice,
        sellPrice,
        stock
    );
    res.status(201).json({
        product: {
            barcode: newProduct.barcode,
            name: newProduct.name,
            category: {
                categoryId: newProduct.category.categoryId,
                description: newProduct.category.description
            },
            weight: newProduct.weight,
            buyPrice: newProduct.buyPrice,
            sellPrice: newProduct.sellPrice,
            stock: newProduct.stock
        }
    });
});

router.get('/:barcode(\\d{1,14})', async (req: any, res: any) => {
    const user = req.user;
    const barcode = req.params.barcode;

    logger.info('User %s fetched product %s as admin', user.username, barcode);

    res.status(200).json({
        product: {
            barcode: req.product.barcode,
            name: req.product.name,
            category: {
                categoryId: req.product.category.categoryId,
                description: req.product.category.description
            },
            weight: req.product.weight,
            buyPrice: req.product.buyPrice,
            sellPrice: req.product.sellPrice,
            stock: req.product.stock
        }
    });
});

router.patch('/:barcode(\\d{1,14})', async (req: any, res: any) => {
    const user = req.user;
    const barcode = req.params.barcode;
    const { name, categoryId, weight, buyPrice, sellPrice, stock } = req.body;

    /* Checking if category exists. */
    if (categoryId !== undefined) {
        const existingCategory = await categoryStore.findById(categoryId);
        if (!existingCategory) {
            logger.error(
                'User %s tried to modify category of product %s to unknown category %s',
                user.username,
                barcode,
                categoryId
            );
            res.status(400).json({
                error_code: 'invalid_reference',
                message: 'Referenced category not found.'
            });
            return;
        }
    }

    const updatedProduct = await productStore.updateProduct(
        barcode,
        deleteUndefinedFields({
            name,
            categoryId,
            weight,
            buyPrice,
            sellPrice,
            stock
        }),
        user.userId
    );

    logger.info(
        'User %s modified product data of product %s to ' +
            '{name: %s, categoryId: %s, weight: %s, buyPrice: %s, sellPrice: %s, stock: %s}',
        user.username,
        barcode,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedProduct.name,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedProduct.category.categoryId,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedProduct.weight,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedProduct.buyPrice,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedProduct.sellPrice,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedProduct.stock
    );

    res.status(200).json({
        product: {
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            barcode: updatedProduct.barcode,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            name: updatedProduct.name,
            category: {
                // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
                categoryId: updatedProduct.category.categoryId,
                // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
                description: updatedProduct.category.description
            },
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            weight: updatedProduct.weight,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            buyPrice: updatedProduct.buyPrice,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            sellPrice: updatedProduct.sellPrice,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            stock: updatedProduct.stock
        }
    });
});

router.delete('/:barcode(\\d{1,14})', async (req: any, res: any) => {
    const product = await productStore.deleteProduct(req.params.barcode);

    if (product === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No product with barcode '${req.params.barcode}' found`
        });

        return;
    }

    res.status(200).json({
        deletedProduct: product
    });
});

router.post('/:barcode(\\d{1,14})/buyIn', async (req: any, res: any) => {
    const barcode = req.params.barcode;
    const { count, buyPrice, sellPrice } = req.body;

    const stock = await productStore.buyIn(barcode, count);

    logger.info(
        "User %s bought in %d items of product '%s' (%s)",
        req.user.username,
        req.product.name,
        req.product.barcode
    );

    const update = {
        sellPrice: req.product.sellPrice !== sellPrice ? sellPrice : undefined,
        buyPrice: req.product.buyPrice !== buyPrice ? buyPrice : undefined
    };

    const updatedProduct = await productStore.updateProduct(barcode, update, req.user.userId);

    if (update.sellPrice !== undefined || update.buyPrice !== undefined) {
        const changes = [];

        if (update.sellPrice !== undefined) {
            changes.push(`sellPrice from ${req.product.sellPrice} to ${update.sellPrice}`);
        }

        if (update.sellPrice !== undefined) {
            changes.push(`buyPrice from ${req.product.buyPrice} to ${update.buyPrice}`);
        }

        logger.info(
            "User %s changed %s on product '%s' (%s)",
            req.user.username,
            changes.join(' and '),
            req.product.name,
            req.product.barcode
        );
    }

    res.status(200).json({
        stock,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        buyPrice: updatedProduct.buyPrice,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        sellPrice: updatedProduct.sellPrice
    });
});

router.get('/:barcode(\\d{1,14})/purchaseHistory', async (req: any, res: any) => {
    const barcode = req.params.barcode;
    const purchases = await historyStore.getProductPurchaseHistory(barcode);

    res.status(200).json({
        purchases: purchases.map((purchase: any) => {
            delete purchase.balanceAfter;
            delete purchase.product;
            return purchase;
        })
    });
});

export default router;
