import { Request, Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import { registerAdmin, loginAdmin } from "../../services/admin/auth.service";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { admin, token } = await registerAdmin(req.body);
  res.status(201).json({
    status: "success",
    token,
    data: {
      admin,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { admin, token } = await loginAdmin(req.body);
  res.status(200).json({
    status: "success",
    token,
    data: {
      admin,
    },
  });
});