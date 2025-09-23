import { Router } from "express";
import { login, register } from "../../controllers/admin/auth.controller";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);

export default router;