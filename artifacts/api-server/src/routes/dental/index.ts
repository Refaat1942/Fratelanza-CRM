import { Router, type IRouter } from "express";
import proceduresRouter from "./procedures";
import chartRouter from "./chart";
import visitsRouter from "./visits";

const router: IRouter = Router();

router.use(proceduresRouter);
router.use(chartRouter);
router.use(visitsRouter);

export default router;
