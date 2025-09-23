import { Router } from 'express';
import profileRouter from './profile.route';

const router: Router = Router();

router.use('/profile', profileRouter);

export default router;
