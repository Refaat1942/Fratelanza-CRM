import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import tasksRouter from "./tasks";
import clientsRouter from "./clients";
import transactionsRouter from "./transactions";
import employeesRouter from "./employees";
import notificationsRouter from "./notifications";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(tasksRouter);
router.use(clientsRouter);
router.use(transactionsRouter);
router.use(employeesRouter);
router.use(notificationsRouter);
router.use(reportsRouter);

export default router;
