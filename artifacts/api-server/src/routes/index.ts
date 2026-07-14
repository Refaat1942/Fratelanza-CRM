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
import attendanceRouter, { publicClockRouter } from "./attendance";
import payrollRouter from "./payroll";
import { requireFeature } from "../middleware/feature";
import { requirePermission } from "../middleware/permissions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicPatientRouter);
router.use(publicClockRouter);
router.use(authRouter);
router.use(meRouter);
router.use(tenantSettingsRouter);
router.use(usersRouter);
router.use(requireFeature("branches"), branchesRouter);
router.use(dashboardRouter);
router.use(requireFeature("notifications"), notificationsRouter);

// Per-module gates: tenant feature toggle (admin can disable per-customer) +
// per-user permission check (manager assigns module access to employees).
router.use(requireFeature("tasks"), requirePermission("tasks"), tasksRouter);
router.use(requireFeature("crm"), requirePermission("crm"), clientsRouter);
router.use(requireFeature("finance"), requirePermission("finance"), transactionsRouter);
router.use(requireFeature("team"), requirePermission("team"), employeesRouter);
router.use(requireFeature("hr_attendance"), requirePermission("team"), attendanceRouter);
router.use(requireFeature("hr_payroll"), requirePermission("team"), payrollRouter);
router.use(requireFeature("products"), requirePermission("products"), productsRouter);
router.use(requireFeature("products"), requirePermission("products"), stockMovementsRouter);
router.use(requireFeature("suppliers"), requirePermission("suppliers"), suppliersRouter);
router.use(requireFeature("purchase_orders"), requirePermission("purchase_orders"), purchaseOrdersRouter);
router.use(requireFeature("rentals"), requirePermission("rentals"), rentalsRouter);
router.use(requireFeature("reports"), requirePermission("reports"), reportsRouter);
router.use(requireFeature("invoicing"), requirePermission("invoicing"), invoicesRouter);
router.use(requirePermission("medical"), medicalRouter);
router.use(requireFeature("clinic_staff"), requirePermission("medical"), clinicStaffRouter);
// router.use(requireFeature("dental"), requirePermission("medical"), dentalRouter);
// router.use(requireFeature("medical"), requirePermission("medical"), treatmentPlansRouter);

export default router;
