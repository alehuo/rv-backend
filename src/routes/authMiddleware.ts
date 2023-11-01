import { verify } from '../jwt/token';
import { findById } from '../db/userStore';
import { verifyRole } from './authUtils';
import logger from './../logger';

const authMiddleware = (requiredRole: string | null = null, tokenSecret = process.env.JWT_SECRET) => {
    return async (req: any, res: any, next: any) => {
        const authHeader = req.get('Authorization');
        let userId = null;

        // verify that Authorization header contains a token
        if (authHeader !== undefined) {
            const parts = authHeader.split(' ');
            if (parts.length == 2 && parts[0] == 'Bearer') {
                const token = verify(parts[1], tokenSecret);

                if (token) {
                    // @ts-expect-error TS(2339) FIXME: Property 'data' does not exist on type 'string | J... Remove this comment to see the full error message
                    userId = token.data.userId;
                }
            }
        }

        if (userId !== null) {
            try {
                const user = await findById(userId);

                if (user) {
                    // finally, verify that user is authorized
                    if (verifyRole(requiredRole, user.role)) {
                        logger.info(
                            'User %s successfully authenticated for %s %s',
                            user.username,
                            req.method,
                            req.originalUrl
                        );
                        req.user = user;
                        next();
                    } else {
                        logger.error('User %s is not authorized for %s %s', user.username, req.method, req.originalUrl);
                        res.status(403).json({
                            error_code: 'not_authorized',
                            message: 'Not authorized'
                        });
                    }
                } else {
                    // token contains nonexistent user or no roles
                    logger.error('Invalid authorization token (token contains nonexistent user or no roles)');
                    res.status(401).json({
                        error_code: 'invalid_token',
                        message: 'Invalid authorization token'
                    });
                }
            } catch (error) {
                logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
                res.status(500).json({
                    error_code: 'internal_error',
                    message: 'Internal error'
                });
            }
        } else {
            // no username in token
            logger.error('Invalid authorization token (no username in token)');
            res.status(401).json({
                error_code: 'invalid_token',
                message: 'Invalid authorization token'
            });
        }
    };
};

export default authMiddleware;
