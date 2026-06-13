import { Router, type IRouter } from "express";
import { requireFeature } from "../../middleware/feature";
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

const router: IRouter = Router();

router.use(requireFeature("medical_patients"), patientsRouter);
router.use(requireFeature("medical_appointments"), appointmentsRouter);
router.use(requireFeature("medical_visits"), visitsRouter);
router.use(requireFeature("medical_invoices"), medicalInvoicesRouter);
router.use(requireFeature("medical_reports"), reportsRouter);
router.use(requireFeature("medical_materials"), materialsRouter);
router.use(requireFeature("medical_prescriptions"), prescriptionsRouter);
router.use(requireFeature("medical_medicine_master"), medicineMasterRouter);
router.use(requireFeature("medical_rx_templates"), doctorTemplatesRouter);
router.use(requireFeature("medical_visits"), diagnosesMasterRouter);
router.use(requireFeature("medical_patients"), alertsRouter);
router.use(requireFeature("medical_doctor_availability"), doctorAvailabilityRouter);
router.use(requireFeature("medical_ai_summary"), aiSummaryRouter);
router.use(requireFeature("medical_patient_documents"), patientDocumentsRouter);
router.use(requireFeature("medical_prescription_ocr"), prescriptionOcrRouter);

export default router;
