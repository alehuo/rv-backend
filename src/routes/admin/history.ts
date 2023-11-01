import { Router } from 'express';
import { getDepositHistory, findDepositById, getPurchaseHistory, findPurchaseById } from '../../db/historyStore';

const router = Router();

router.get('/depositHistory', async (req, res) => {
    // TODO: Deposit history on buginen
    // @ts-expect-error TS(2554) FIXME: Expected 0 arguments, but got 1.
    const history = await getDepositHistory(req.params.userId);

    res.status(200).json({
        deposits: history
    });
});

router.get('/depositHistory/:depositId', async (req, res) => {
    const deposit = await findDepositById(req.params.depositId);

    if (deposit === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No deposit with id '${req.params.depositId}' found`
        });

        return;
    }

    res.status(200).json({
        deposit
    });
});

router.get('/purchaseHistory', async (req, res) => {
    const purchases = await getPurchaseHistory();

    res.status(200).json({
        purchases
    });
});

router.get('/purchaseHistory/:purchaseId', async (req, res) => {
    const purchase = await findPurchaseById(req.params.purchaseId);

    if (purchase === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No purchase event with ID '${req.params.purchaseId}' found`
        });

        return;
    }

    res.status(200).json({
        purchase
    });
});

export default router;
