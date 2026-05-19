import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";
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
import { requireFeature } from "../middleware/feature";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(requireFeature("notifications"), notificationsRouter);

// Per-module feature gates (admin can disable any of these per-customer).
router.use(requireFeature("tasks"), tasksRouter);
router.use(requireFeature("crm"), clientsRouter);
router.use(requireFeature("finance"), transactionsRouter);
router.use(requireFeature("team"), employeesRouter);
router.use(requireFeature("products"), productsRouter);
router.use(requireFeature("products"), stockMovementsRouter);
router.use(requireFeature("suppliers"), suppliersRouter);
router.use(requireFeature("purchase_orders"), purchaseOrdersRouter);
router.use(requireFeature("rentals"), rentalsRouter);
router.use(requireFeature("reports"), reportsRouter);

export default router;
