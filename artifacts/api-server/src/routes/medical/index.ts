import { Router, type IRouter } from "express";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import visitsRouter from "./visits";
import medicalInvoicesRouter from "./invoices";
import reportsRouter from "./reports";
import materialsRouter from "./materials";
// Phase F2: Procedures module removed from UI; backend route also unmounted.
// Catalog table `medical_procedures` is retained in the DB for data preservation.

const router: IRouter = Router();

router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(visitsRouter);
router.use(medicalInvoicesRouter);
router.use(reportsRouter);
router.use(materialsRouter);

export default router;
