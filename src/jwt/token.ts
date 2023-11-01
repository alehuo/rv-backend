import { sign as _sign, verify as _verify } from 'jsonwebtoken';
import logger from '../logger';

export function sign(payload: { userId: any }, tokenSecret = process.env.JWT_SECRET) {
    if (tokenSecret === undefined) {
        return null;
    }
    return _sign({ exp: Math.floor(Date.now() / 1000) + 86400, data: payload }, tokenSecret, {
        algorithm: 'HS256'
    });
}

export function verify(jwtToken: string, tokenSecret = process.env.JWT_SECRET) {
    try {
        if (tokenSecret === undefined) {
            return null;
        }
        return _verify(jwtToken, tokenSecret, { algorithms: ['HS256'] });
    } catch (err) {
        // log error
        logger.error(err);
        return null;
    }
}
