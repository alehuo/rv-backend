import express, { urlencoded, json } from 'express';
import { resolve } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { middleware } from 'express-openapi-validator';
import authRoute from './routes/auth';
import userRoute from './routes/user';
import userPurchaseHistoryRoute from './routes/userPurchaseHistory';
import userDepositHistoryRoute from './routes/userDepositHistory';
import registerRoute from './routes/register';
import adminAuth from './routes/admin/adminAuth';
import adminProducts from './routes/admin/products';
import userProducts from './routes/products';
import userCategories from './routes/categories';
import adminBoxes from './routes/admin/boxes';
import adminCategories from './routes/admin/categories';
import adminUsers from './routes/admin/users';
import apiResetRoute from './routes/test_env/api_data_reset';
import adminDefaultMargin from './routes/admin/default_margin';
import adminHistory from './routes/admin/history';
import adminPreferences from './routes/admin/preferences';
import logger from './logger';

export const createApp = () => {
    const app = express();
    app.use(urlencoded({ extended: false }));
    app.use(json());
    app.use(cors());
    app.use(helmet());

    app.use(
        middleware({
            apiSpec: resolve(__dirname, '../openapi.yaml'),
            validateRequests: true,
            validateResponses: process.env.NODE_ENV !== 'production',
            ignorePaths: /^\/api\/[^/]+\/test\/.*/
        })
    );

    app.use('/api/v1/authenticate', authRoute);
    app.use('/api/v1/user/purchaseHistory', userPurchaseHistoryRoute);
    app.use('/api/v1/user/depositHistory', userDepositHistoryRoute);
    app.use('/api/v1/user', userRoute);
    app.use('/api/v1/register', registerRoute);
    app.use('/api/v1/products', userProducts);
    app.use('/api/v1/categories', userCategories);

    app.use('/api/v1/admin/defaultMargin', adminDefaultMargin);
    app.use('/api/v1/admin/authenticate', adminAuth);
    app.use('/api/v1/admin/products', adminProducts);
    app.use('/api/v1/admin/boxes', adminBoxes);
    app.use('/api/v1/admin/categories', adminCategories);
    app.use('/api/v1/admin/users', adminUsers);
    app.use('/api/v1/admin', adminHistory);
    app.use('/api/v1/admin/preferences', adminPreferences);
    app.use('/api/v1/test/reset_data', apiResetRoute);
    app.use((error: any, req: any, res: any, next: any) => {
        if (error.status === 400) {
            return res.status(400).json({
                error_code: 'bad_request',
                message: 'Invalid or missing fields in request',
                errors: error.errors.map(({ path, message }: any) => `Field ${path.substring(6)} ${message}`)
            });
        }

        logger.error(error.message)
        return res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal server error'
        });
    });

    return app;
};
