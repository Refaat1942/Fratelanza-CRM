import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import tasksRouter from "./tasks";
import clientsRouter from "./clients";
import transactionsRouter from "./transactions";
import employeesRouter from "./employees";
import notificationsRouter from "./notifications";
import reportsRouter from "./reports";
import productsRouter from "./products";
import rentalsRouter from "./rentals";
import usersRouter from "./users";
import suppliersRouter from "./suppliers";
import stockMovementsRouter from "./stockMovements";
import purchaseOrdersRouter from "./purchaseOrders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(tasksRouter);
router.use(clientsRouter);
router.use(transactionsRouter);
router.use(employeesRouter);
router.use(notificationsRouter);
router.use(reportsRouter);
router.use(stockMovementsRouter);
router.use(productsRouter);
router.use(rentalsRouter);
router.use(usersRouter);
router.use(suppliersRouter);
router.use(purchaseOrdersRouter);

export default router;
