import {Router} from "express";
import authRouter from './routes/public/auth.route';
import clientAuthRouter from './routes/client/auth.route';
import adminAuthRouter from './routes/admin/auth.route';
import userRouter from './routes/admin/user.route';
import profileRouter from './routes/client/profile.route';
import campaignRouter from './routes/client/campaign.route';
import campaignContactRouter from './routes/client/campaign-contact.route';
import clientManagementRouter from './routes/admin/client-management.route';
import phoneNumberManagementRouter from './routes/admin/phone-number-management.route';
import agentManagementRouter from './routes/admin/agent-management.route';
import clientAgentRouter from './routes/client/agent.route';
import batchCallRouter from './routes/client/batch-call.route';
import callReportsRouter from './routes/client/call-reports.route';

const mainRouter: Router = Router();

// Public auth (legacy - can be removed if not needed)
mainRouter.use('/auth', authRouter);

// Separate client and admin auth endpoints
mainRouter.use('/client/auth', clientAuthRouter);
mainRouter.use('/admin/auth', adminAuthRouter);

// Other routes
mainRouter.use('/admin/users', userRouter);
mainRouter.use('/admin/clients', clientManagementRouter);
mainRouter.use('/admin/phone-numbers', phoneNumberManagementRouter);
mainRouter.use('/admin/agents', agentManagementRouter);
mainRouter.use('/client/profile', profileRouter);
mainRouter.use('/client/campaigns', campaignRouter);
mainRouter.use('/client/campaigns', campaignContactRouter);
mainRouter.use('/client/agents', clientAgentRouter);
mainRouter.use('/client/batch-calls', batchCallRouter);
mainRouter.use('/client/call-reports', callReportsRouter);

export default mainRouter;
