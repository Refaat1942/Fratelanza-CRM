import { Router, type IRouter } from "express";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import visitsRouter from "./visits";
import medicalInvoicesRouter from "./invoices";
import reportsRouter from "./reports";
import materialsRouter from "./materials";
import prescriptionsRouter from "./prescriptions";
import alertsRouter from "./alerts";
import doctorAvailabilityRouter from "./doctor-availability";
import aiSummaryRouter from "./ai-summary";
import proceduresRouter from "./procedures";
import physiotherapyRouter from "./physiotherapy";
import clinicalNutritionRouter from "./clinicalNutrition";
import { requireMedicalSubmodule, requirePhysiotherapy, requireClinicalNutrition } from "../../lib/medicalFeatures";

const router: IRouter = Router();

router.use(requireMedicalSubmodule("medical_patients"), patientsRouter);
router.use(requireMedicalSubmodule("medical_appointments"), appointmentsRouter);
router.use(requireMedicalSubmodule("medical_visits"), visitsRouter);
router.use(requireMedicalSubmodule("medical_invoices"), medicalInvoicesRouter);
router.use(requireMedicalSubmodule("medical_reports"), reportsRouter);
router.use(requireMedicalSubmodule("medical_materials"), materialsRouter);
router.use(requireMedicalSubmodule("medical_prescriptions"), prescriptionsRouter);
router.use(requireMedicalSubmodule("medical_doctor_availability"), doctorAvailabilityRouter);
router.use(requireMedicalSubmodule("medical_procedures"), proceduresRouter);
router.use(alertsRouter);
router.use(aiSummaryRouter);
router.use(requirePhysiotherapy, physiotherapyRouter);
router.use(requireClinicalNutrition, clinicalNutritionRouter);

export default router;
