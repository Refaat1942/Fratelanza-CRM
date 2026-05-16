import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import tasksRouter from "./tasks";
import clientsRouter from "./clients";
import transactionsRouter from "./transactions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(tasksRouter);
router.use(clientsRouter);
router.use(transactionsRouter);

export default router;
