import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import * as profileService from '../../services/client/profile.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = await profileService.getProfileById(req.user.id);
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
