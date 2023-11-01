import knex from '../db/knex';
import bcrypt from 'bcrypt';
import { deleteUndefinedFields } from '../utils/objectUtils';

const rowToUser = (row: any) => {
    if (row !== undefined) {
        return {
            userId: row.userid,
            username: row.name,
            fullName: row.realname,
            email: row.univident,
            moneyBalance: row.saldo,
            role: row.role,
            passwordHash: row.pass
        };
    } else {
        return undefined;
    }
};

export const getUsers = async () => {
    const data = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'RVPERSON.saldo',
            'ROLE.role',
            'RVPERSON.pass'
        );
    return data.map(rowToUser);
};

export const findById = async (userId: any) => {
    const row = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'RVPERSON.saldo',
            'ROLE.role',
            'RVPERSON.pass'
        )
        .where('RVPERSON.userid', userId)
        .first();
    return rowToUser(row);
};

export const findByUsername = async (username: any) => {
    const row = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'RVPERSON.saldo',
            'ROLE.role',
            'RVPERSON.pass'
        )
        .where('RVPERSON.name', username)
        .first();
    return rowToUser(row);
};

export const findByEmail = async (email: any) => {
    const row = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'RVPERSON.saldo',
            'ROLE.role',
            'RVPERSON.pass'
        )
        .where('RVPERSON.univident', email)
        .first();
    return rowToUser(row);
};

export const insertUser = async (userData: any) => {
    const passwordHash = bcrypt.hashSync(userData.password, 11);

    const insertedPersonRows = await knex('RVPERSON')
        .insert({
            createdate: new Date(),
            // roleid 2 = USER1
            roleid: 2,
            name: userData.username,
            univident: userData.email,
            pass: passwordHash,
            saldo: 0,
            realname: userData.fullName
        })
        .returning(['userid']);

    return {
        userId: insertedPersonRows[0].userid,
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        moneyBalance: 0,
        role: 'USER1',
        passwordHash: passwordHash
    };
};

export const updateUser = async (userId: any, userData: any) => {
    return await knex.transaction(async (trx: any) => {
        const rvpersonFields = deleteUndefinedFields({
            name: userData.username,
            realname: userData.fullName,
            univident: userData.email,
            saldo: userData.moneyBalance
        });
        if (userData.password !== undefined) {
            rvpersonFields.pass = bcrypt.hashSync(userData.password, 11);
        }
        if (userData.role !== undefined) {
            const roleRow = await knex('ROLE').transacting(trx).select('roleid').where({ role: userData.role }).first();
            rvpersonFields.roleid = roleRow.roleid;
        }
        await knex('RVPERSON').transacting(trx).update(rvpersonFields).where({ userid: userId });

        const userRow = await knex('RVPERSON')
            .transacting(trx)
            .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
            .select(
                'RVPERSON.userid',
                'RVPERSON.name',
                'RVPERSON.realname',
                'RVPERSON.univident',
                'RVPERSON.saldo',
                'ROLE.role',
                'RVPERSON.pass'
            )
            .where('RVPERSON.userid', userId)
            .first();
        return rowToUser(userRow);
    });
};

export const verifyPassword = async (password: any, passwordHash: any) => {
    return await bcrypt.compare(password, passwordHash);
};

export const recordDeposit = async (userId: any, amount: any) => {
    return await knex.transaction(async (trx: any) => {
        const now = new Date();

        const updatedPersonRows = await knex('RVPERSON')
            .transacting(trx)
            .where({ userid: userId })
            .increment({ saldo: amount })
            .returning(['saldo']);

        const insertedSaldhistRows = await knex('SALDOHISTORY')
            .transacting(trx)
            .insert({
                userid: userId,
                time: now,
                saldo: updatedPersonRows[0].saldo,
                difference: amount
            })
            .returning(['saldhistid']);
        const insertedPershistRows = await knex('PERSONHIST')
            .transacting(trx)
            .insert({
                time: now,
                actionid: 17,
                userid1: userId,
                userid2: userId,
                saldhistid: insertedSaldhistRows[0].saldhistid
            })
            .returning(['pershistid']);

        return {
            depositId: insertedPershistRows[0].pershistid,
            time: now.toISOString(),
            amount: amount,
            balanceAfter: updatedPersonRows[0].saldo
        };
    });
};
