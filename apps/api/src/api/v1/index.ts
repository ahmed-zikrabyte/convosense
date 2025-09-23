import {Router} from "express";
import authRouter from './routes/public/auth.route';
import clientAuthRouter from './routes/client/auth.route';
import adminAuthRouter from './routes/admin/auth.route';
import userRouter from './routes/admin/user.route';
import profileRouter from './routes/client/profile.route';

const mainRouter: Router = Router();

// Public auth (legacy - can be removed if not needed)
mainRouter.use('/auth', authRouter);

// Separate client and admin auth endpoints
mainRouter.use('/client/auth', clientAuthRouter);
mainRouter.use('/admin/auth', adminAuthRouter);

// Other routes
mainRouter.use('/admin/users', userRouter);
mainRouter.use('/client/profile', profileRouter);

export default mainRouter;
