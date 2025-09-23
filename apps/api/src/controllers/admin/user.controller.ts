import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import * as userService from '../../services/admin/user.service';

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});
