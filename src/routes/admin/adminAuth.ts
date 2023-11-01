import { Router } from 'express';
const router = Router();
import { authenticateUser } from '../authUtils';

router.post('/', authenticateUser('ADMIN', process.env.JWT_ADMIN_SECRET));

export default router;
