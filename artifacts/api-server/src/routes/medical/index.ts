import { Router, type IRouter } from "express";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import visitsRouter from "./visits";
import medicalInvoicesRouter from "./invoices";
import reportsRouter from "./reports";
import materialsRouter from "./materials";
import prescriptionsRouter from "./prescriptions";
import medicineMasterRouter from "./medicine-master";
import doctorTemplatesRouter from "./doctor-templates";
import diagnosesMasterRouter from "./diagnoses-master";
import alertsRouter from "./alerts";
import doctorAvailabilityRouter from "./doctor-availability";
import aiSummaryRouter from "./ai-summary";
import patientDocumentsRouter from "./patient-documents";
import prescriptionOcrRouter from "./prescription-ocr";
// Phase F2: Procedures module removed from UI; backend route also unmounted.
// Catalog table `medical_procedures` is retained in the DB for data preservation.

const router: IRouter = Router();

router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(visitsRouter);
router.use(medicalInvoicesRouter);
router.use(reportsRouter);
router.use(materialsRouter);
router.use(prescriptionsRouter);
router.use(medicineMasterRouter);
router.use(doctorTemplatesRouter);
router.use(diagnosesMasterRouter);
router.use(alertsRouter);
router.use(doctorAvailabilityRouter);
router.use(aiSummaryRouter);
router.use(patientDocumentsRouter);
router.use(prescriptionOcrRouter);

export default router;
