import {Router} from "express";
import routes from "./routes";

const mainRouter: Router = Router();

mainRouter.use("/", routes);

export default mainRouter;
