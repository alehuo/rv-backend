import { Router } from 'express';
const router = Router();
import { findByUsername, findByEmail, updateUser, recordDeposit } from '../db/userStore';
import authMiddleware from './authMiddleware';
import logger from '../logger';
import { deleteUndefinedFields } from '../utils/objectUtils';

router.use(authMiddleware());

router.get('/', async (req, res) => {
    // @ts-expect-error TS(2339) FIXME: Property 'user' does not exist on type 'Request<{}... Remove this comment to see the full error message
    const user = req.user;

    logger.info('User %s fetched user data', user.username);
    return res.status(200).json({
        user: {
            userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            moneyBalance: user.moneyBalance,
            role: user.role
        }
    });
});

router.patch('/', async (req, res) => {
    // @ts-expect-error TS(2339) FIXME: Property 'user' does not exist on type 'Request<{}... Remove this comment to see the full error message
    const user = req.user;

    const username = req.body.username;
    const fullName = req.body.fullName;
    const email = req.body.email;

    // Check if user, email exists
    if (username !== undefined) {
        const userByUsername = await findByUsername(username);
        if (userByUsername) {
            logger.error('User %s tried to change username to %s but it was taken', user.username, username);
            res.status(409).json({
                error_code: 'identifier_taken',
                message: 'Username already in use.'
            });
            return;
        }
    }
    if (email !== undefined) {
        const userByEmail = await findByEmail(email);
        if (userByEmail) {
            logger.error(
                'User %s tried to change email from %s to %s but it was taken',
                user.username,
                user.email,
                email
            );
            res.status(409).json({
                error_code: 'identifier_taken',
                message: 'Email address already in use.'
            });
            return;
        }
    }

    const updatedUser = await updateUser(user.userId, deleteUndefinedFields({ username, fullName, email }));

    logger.info(
        'User %s changed user data from {%s, %s, %s} to {%s, %s, %s}',
        user.username,
        user.username,
        user.fullName,
        user.email,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedUser.username,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedUser.fullName,
        // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        updatedUser.email
    );

    res.status(200).json({
        user: {
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            userId: updatedUser.userId,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            username: updatedUser.username,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            fullName: updatedUser.fullName,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            email: updatedUser.email,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            moneyBalance: updatedUser.moneyBalance,
            // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
            role: updatedUser.role
        }
    });
});

router.post('/deposit', async (req, res) => {
    // @ts-expect-error TS(2339) FIXME: Property 'user' does not exist on type 'Request<{}... Remove this comment to see the full error message
    const user = req.user;
    const amount = req.body.amount;

    const deposit = await recordDeposit(user.userId, amount);

    logger.info('User %s deposited %s cents', user.username, amount);
    res.status(200).json({
        accountBalance: deposit.balanceAfter,
        deposit: {
            depositId: deposit.depositId,
            time: deposit.time,
            amount: deposit.amount,
            balanceAfter: deposit.balanceAfter
        }
    });
});

router.post('/changePassword', async (req, res) => {
    // @ts-expect-error TS(2339) FIXME: Property 'user' does not exist on type 'Request<{}... Remove this comment to see the full error message
    const user = req.user;
    const password = req.body.password;

    await updateUser(user.userId, { password: password });

    logger.info('User %s changed password', user.username);
    res.status(204).end();
});

export default router;
