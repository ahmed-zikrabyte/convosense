import { Router } from 'express';
import publicRoutes from './public';
import adminRoutes from './admin';
import clientRoutes from './client';

const router: Router = Router();

router.use('/', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/client', clientRoutes);

export default router;
