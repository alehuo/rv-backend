import { sign } from '../jwt/token';
import { findByUsername, verifyPassword } from '../db/userStore';
import logger from './../logger';

/* null means no role requirements. */
const verifyRole = (requiredRole: string | null, userRole: string) => {
    return requiredRole === null || requiredRole === userRole;
};

const _verifyRole = verifyRole;
export { _verifyRole as verifyRole };

export function authenticateUser(requiredRole: string | null = null, tokenSecret = process.env.JWT_SECRET) {
    return async (req: any, res: any) => {
        const body = req.body;
        const username = body.username;
        const password = body.password;

        const user = await findByUsername(username);

        if (user) {
            if (await verifyPassword(password, user.passwordHash)) {
                if (verifyRole(requiredRole, user.role)) {
                    logger.info('User %s logged in as role %s', user.username, requiredRole);
                    res.status(200).json({
                        accessToken: sign({ userId: user.userId }, tokenSecret)
                    });
                } else {
                    logger.error('User %s is not authorized to login as role %s', user.username, requiredRole);
                    res.status(403).json({
                        error_code: 'not_authorized',
                        message: 'Not authorized'
                    });
                }
            } else {
                logger.error('Failed to login with username and password. Username was %s', username);
                res.status(401).json({
                    error_code: 'invalid_credentials',
                    message: 'Invalid username or password'
                });
            }
        } else {
            logger.error('Failed to login with username and password. Username was %s', username);
            res.status(401).json({
                error_code: 'invalid_credentials',
                message: 'Invalid username or password'
            });
        }
    };
}
