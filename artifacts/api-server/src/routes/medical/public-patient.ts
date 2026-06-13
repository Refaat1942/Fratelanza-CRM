import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import {
  db,
  patientsTable,
  visitsTable,
  prescriptionsTable,
  medicalAppointmentsTable,
  employeesTable,
  getCurrentTenant,
  isFeatureEnabled,
} from "@workspace/db";

const router: IRouter = Router();

/** Public read-only patient history — accessed via QR scan (no auth). */
router.get("/public/patient/:token", async (req, res): Promise<void> => {
  const tenant = getCurrentTenant();
  if (tenant && !isFeatureEnabled(tenant.features, "medical_patient_qr")) {
    res.status(403).json({ error: "feature_disabled", feature: "medical_patient_qr" });
    return;
  }
  const token = String(req.params.token || "").trim();
  if (!token || token.length < 16) {
    res.status(400).json({ error: "invalid_token" });
    return;
  }

  const [patient] = await db
    .select({
      id: patientsTable.id,
      firstName: patientsTable.firstName,
      firstNameAr: patientsTable.firstNameAr,
      lastName: patientsTable.lastName,
      lastNameAr: patientsTable.lastNameAr,
      gender: patientsTable.gender,
      dateOfBirth: patientsTable.dateOfBirth,
      bloodType: patientsTable.bloodType,
      allergies: patientsTable.allergies,
      chronicConditions: patientsTable.chronicConditions,
    })
    .from(patientsTable)
    .where(eq(patientsTable.qrToken, token));

  if (!patient) {
    res.status(404).json({ error: "patient_not_found" });
    return;
  }

  const visits = await db
    .select({
      id: visitsTable.id,
      visitDate: visitsTable.visitDate,
      chiefComplaint: visitsTable.chiefComplaint,
      chiefComplaintAr: visitsTable.chiefComplaintAr,
      diagnosis: visitsTable.diagnosis,
      diagnosisAr: visitsTable.diagnosisAr,
      treatment: visitsTable.treatment,
      treatmentAr: visitsTable.treatmentAr,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(visitsTable)
    .leftJoin(employeesTable, eq(employeesTable.id, visitsTable.doctorId))
    .where(eq(visitsTable.patientId, patient.id))
    .orderBy(desc(visitsTable.visitDate))
    .limit(200);

  const visitIds = visits.map(v => v.id);
  const prescriptions = visitIds.length > 0
    ? await db
        .select({
          id: prescriptionsTable.id,
          visitId: prescriptionsTable.visitId,
          medicineName: prescriptionsTable.medicineName,
          medicineNameAr: prescriptionsTable.medicineNameAr,
          dosage: prescriptionsTable.dosage,
          frequency: prescriptionsTable.frequency,
          durationDays: prescriptionsTable.durationDays,
          instructions: prescriptionsTable.instructions,
          instructionsAr: prescriptionsTable.instructionsAr,
          createdAt: prescriptionsTable.createdAt,
        })
        .from(prescriptionsTable)
        .where(inArray(prescriptionsTable.visitId, visitIds))
        .orderBy(desc(prescriptionsTable.createdAt))
    : [];

  const appointments = await db
    .select({
      id: medicalAppointmentsTable.id,
      startAt: medicalAppointmentsTable.startAt,
      status: medicalAppointmentsTable.status,
      reason: medicalAppointmentsTable.reason,
      reasonAr: medicalAppointmentsTable.reasonAr,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(medicalAppointmentsTable)
    .leftJoin(employeesTable, eq(employeesTable.id, medicalAppointmentsTable.doctorId))
    .where(eq(medicalAppointmentsTable.patientId, patient.id))
    .orderBy(desc(medicalAppointmentsTable.startAt))
    .limit(100);

  res.json({ patient, visits, prescriptions, appointments });
});

export default router;
