import { Router } from 'express';
import { getProfile } from '../../controllers/client/profile.controller';
import { protect } from '../../middleware/auth.middleware';

const router: Router = Router();

router.use(protect('client'));

router.get('/', getProfile);

export default router;
