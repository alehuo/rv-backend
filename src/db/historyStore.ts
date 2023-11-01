import knex from './knex';

const rowToPurchase = (row: any) => {
    return {
        purchaseId: row.itemhistid,
        time: new Date(row.time).toISOString(),
        price: row.sellprice,
        balanceAfter: row.saldo,
        stockAfter: row.count
    };
};

const rowToDeposit = (row: any) => {
    return {
        depositId: row.pershistid,
        time: new Date(row.time).toISOString(),
        amount: row.difference,
        balanceAfter: row.saldo
    };
};

const rowToProduct = (row: any) => {
    return {
        barcode: row.barcode,
        name: row.descr,
        category: {
            categoryId: row.pgrpid,
            description: row.pgrpdescr
        },
        weight: row.weight,
        buyPrice: row.buyprice,
        sellPrice: row.sellprice,
        stock: row.stock
    };
};

const rowToUser = (row: any) => {
    return {
        userId: row.userid,
        username: row.name,
        fullName: row.realname,
        email: row.univident,
        role: row.role,
        moneyBalance: row.currentsaldo
    };
};

const createPurchaseHistoryQuery = () =>
    knex('ITEMHISTORY')
        .leftJoin('RVITEM', 'ITEMHISTORY.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
        .leftJoin('RVPERSON', 'ITEMHISTORY.userid', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .leftJoin('SALDOHISTORY', 'ITEMHISTORY.saldhistid', 'SALDOHISTORY.saldhistid')
        .select(
            'ITEMHISTORY.itemhistid',
            'ITEMHISTORY.time',
            'ITEMHISTORY.count',
            'RVITEM.descr',
            'RVITEM.pgrpid',
            'PRODGROUP.descr as pgrpdescr',
            'RVITEM.weight',
            'PRICE.barcode',
            'PRICE.sellprice',
            'PRICE.buyprice',
            'PRICE.count as stock',
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'RVPERSON.saldo as currentsaldo',
            'ROLE.role',
            'SALDOHISTORY.saldo'
        )
        .where('ITEMHISTORY.actionid', 5) /* actionid 5 = buy action */
        .orderBy([
            { column: 'ITEMHISTORY.time', order: 'desc' },
            { column: 'ITEMHISTORY.itemhistid', order: 'desc' }
        ]);

const createDepositHistoryQuery = () =>
    knex('PERSONHIST')
        .leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
        .leftJoin('RVPERSON', 'PERSONHIST.userid1', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'PERSONHIST.pershistid',
            'PERSONHIST.time',
            'SALDOHISTORY.difference',
            'SALDOHISTORY.saldo',
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'RVPERSON.saldo as currentsaldo',
            'ROLE.role'
        )
        .where('PERSONHIST.actionid', 17) /* actionid 17 = deposit action */
        .orderBy([
            { column: 'PERSONHIST.time', order: 'desc' },
            { column: 'PERSONHIST.pershistid', order: 'desc' }
        ]);

export const getPurchaseHistory = async () => {
    const data = await createPurchaseHistoryQuery();

    return data.map((row: any) => {
        return {
            ...rowToPurchase(row),
            product: rowToProduct(row),
            user: rowToUser(row)
        };
    });
};

export const getUserPurchaseHistory = async (userId: any) => {
    const data = await createPurchaseHistoryQuery().andWhere('ITEMHISTORY.userid', userId);

    return data.map((row: any) => {
        return {
            ...rowToPurchase(row),
            product: rowToProduct(row)
        };
    });
};

export const getProductPurchaseHistory = async (barcode: any) => {
    const data = await createPurchaseHistoryQuery().andWhere('PRICE.barcode', barcode);

    return data.map((row: any) => {
        return {
            ...rowToPurchase(row),
            user: rowToUser(row)
        };
    });
};

export const findPurchaseById = async (purchaseId: any) => {
    const row = await createPurchaseHistoryQuery().andWhere('ITEMHISTORY.itemhistid', purchaseId).first();

    if (row !== undefined) {
        return {
            ...rowToPurchase(row),
            product: rowToProduct(row),
            user: rowToUser(row)
        };
    } else {
        return undefined;
    }
};

export const getDepositHistory = async () => {
    const data = await createDepositHistoryQuery();

    return data.map((row: any) => {
        return {
            ...rowToDeposit(row),
            user: rowToUser(row)
        };
    });
};

export const getUserDepositHistory = async (userId: any) => {
    const data = await createDepositHistoryQuery().andWhere('PERSONHIST.userid1', userId);

    return data.map(rowToDeposit);
};

export const findDepositById = async (depositId: any) => {
    const row = await createDepositHistoryQuery().andWhere('PERSONHIST.pershistid', depositId).first();

    if (row !== undefined) {
        return {
            ...rowToDeposit(row),
            user: rowToUser(row)
        };
    } else {
        return undefined;
    }
};