import {Router} from "express";
import retellRoute from "./retell.route";

const router: Router = Router();

router.use("/", retellRoute);

export default router;
