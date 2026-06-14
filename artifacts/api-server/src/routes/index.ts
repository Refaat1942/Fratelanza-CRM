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
import invoicesRouter from "./invoices";
import medicalRouter from "./medical";
import publicPatientRouter from "./medical/public-patient";
import clinicStaffRouter from "./clinicStaff";
// Dental + Treatment Plans removed from UI by user request (Phase F3).
// Routers + DB tables kept intact for data preservation. Re-enable here if needed.
// import dentalRouter from "./dental";
// import treatmentPlansRouter from "./treatmentPlans";
import branchesRouter from "./branches";
import tenantSettingsRouter from "./tenantSettings";
import { requireFeature } from "../middleware/feature";
import { requirePermission } from "../middleware/permissions";
import { onlyForPaths } from "../middleware/pathGate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicPatientRouter);
router.use(authRouter);
router.use(meRouter);
router.use(tenantSettingsRouter);
router.use(usersRouter);

// Feature/permission gates must be path-scoped. `router.use(requireFeature(X), subRouter)`
// runs the gate on *every* later request when subRouter is mounted at `/`, which blocked
// medical uploads with "Feature disabled: branches" when branches was turned off.
router.use(onlyForPaths("/branches", requireFeature("branches")));
router.use(branchesRouter);
router.use(dashboardRouter);
router.use(onlyForPaths("/notifications", requireFeature("notifications")));
router.use(notificationsRouter);

// Per-module gates: tenant feature toggle (admin can disable per-customer) +
// per-user permission check (manager assigns module access to employees).
router.use(onlyForPaths("/tasks", requireFeature("tasks"), requirePermission("tasks")));
router.use(tasksRouter);
router.use(onlyForPaths("/clients", requireFeature("crm"), requirePermission("crm")));
router.use(clientsRouter);
router.use(onlyForPaths("/transactions", requireFeature("finance"), requirePermission("finance")));
router.use(transactionsRouter);
router.use(onlyForPaths("/employees", requireFeature("team"), requirePermission("team")));
router.use(employeesRouter);
router.use(onlyForPaths("/products", requireFeature("products"), requirePermission("products")));
router.use(productsRouter);
router.use(onlyForPaths("/stock-movements", requireFeature("products"), requirePermission("products")));
router.use(stockMovementsRouter);
router.use(onlyForPaths("/suppliers", requireFeature("suppliers"), requirePermission("suppliers")));
router.use(suppliersRouter);
router.use(onlyForPaths("/purchase-orders", requireFeature("purchase_orders"), requirePermission("purchase_orders")));
router.use(purchaseOrdersRouter);
router.use(onlyForPaths("/rentals", requireFeature("rentals"), requirePermission("rentals")));
router.use(rentalsRouter);
router.use(onlyForPaths("/reports", requireFeature("reports"), requirePermission("reports")));
router.use(reportsRouter);
router.use(onlyForPaths("/invoices", requireFeature("invoicing"), requirePermission("invoicing")));
router.use(invoicesRouter);
router.use(medicalRouter);
router.use(onlyForPaths("/clinic-staff", requireFeature("clinic_staff"), requirePermission("clinic_staff")));
router.use(clinicStaffRouter);
// router.use(onlyForPaths("/dental", requireFeature("dental"), requirePermission("medical")));
// router.use(dentalRouter);
// router.use(onlyForPaths("/treatment-plans", requireFeature("medical"), requirePermission("medical")));
// router.use(treatmentPlansRouter);

export default router;
