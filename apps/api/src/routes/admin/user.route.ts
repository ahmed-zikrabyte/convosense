import { Router } from 'express';
import { getUsers } from '../../controllers/admin/user.controller';
import { protect } from '../../middleware/auth.middleware';

const router: Router = Router();

router.use(protect('admin'));

router.get('/', getUsers);

export default router;
