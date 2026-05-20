import { Router, type IRouter } from "express";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import visitsRouter from "./visits";
import proceduresRouter from "./procedures";
import medicalInvoicesRouter from "./invoices";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(visitsRouter);
router.use(proceduresRouter);
router.use(medicalInvoicesRouter);
router.use(reportsRouter);

export default router;
