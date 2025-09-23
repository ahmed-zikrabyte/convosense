import {Request, Response} from "express";
import catchAsync from "../../../../utils/catchAsync";
import {registerClient, loginClient} from "../../services/client/auth.service";

export const register = catchAsync(async (req: Request, res: Response) => {
  const {client, token} = await registerClient(req.body);
  res.status(201).json({
    status: "success",
    token,
    data: {
      client,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const {client, token} = await loginClient(req.body);
  res.status(200).json({
    status: "success",
    token,
    data: {
      client,
    },
  });
});
