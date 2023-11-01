import { Router } from 'express';
const router = Router();
import { authenticateUser } from './authUtils';

router.post('/', authenticateUser());

export default router;
