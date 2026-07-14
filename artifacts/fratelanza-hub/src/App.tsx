import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { FeaturesProvider, useFeatures } from "@/components/FeaturesProvider";
import { BrandingProvider } from "@/components/BrandingProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import CRM from "@/pages/crm";
import Finance from "@/pages/finance";
import Team from "@/pages/team";
import NotificationsPage from "@/pages/notifications-page";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Products from "@/pages/products";
import Rentals from "@/pages/rentals";
import Suppliers from "@/pages/suppliers";
import PurchaseOrders from "@/pages/purchase-orders";
import Invoices from "@/pages/invoices";
import Patients from "@/pages/medical/patients";
import Appointments from "@/pages/medical/appointments";
import Visits from "@/pages/medical/visits";
import MedicalMaterials from "@/pages/medical/materials";
import MedicalInvoices from "@/pages/medical/invoices";
import MedicalReports from "@/pages/medical/reports";
import Prescriptions from "@/pages/medical/prescriptions";
import MedicineMaster from "@/pages/medical/medicine-master";
import DoctorTemplates from "@/pages/medical/doctor-templates";
import PublicPatientHistory from "@/pages/public/patient-history";
import DoctorAvailability from "@/pages/medical/doctor-availability";
import ClinicStaff from "@/pages/medical/clinic-staff";
import Branches from "@/pages/branches";
import AttendancePage from "@/pages/hr/attendance";
import PayrollPage from "@/pages/hr/payroll";
import ClockKiosk from "@/pages/hr/clock-kiosk";
import PublicEmployeeClock from "@/pages/public/employee-clock";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import BlockedPage from "@/pages/blocked";
import { DeleteConfirmProvider } from "@/components/DeleteConfirmProvider";
import { useLanguage } from "@/components/LanguageProvider";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Login />;
  return <>{children}</>;
}

function FeatureGate({
  feature, permission, children,
}: { feature: string; permission?: string; children: React.ReactNode }) {
  const { features, loading } = useFeatures();
  const { user } = useAuth();
  const { t } = useLanguage();
  if (loading) return null;
  if (features[feature] === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
        <p className="text-lg font-semibold text-foreground">{t("Module not available", "الوحدة غير متاحة")}</p>
        <p className="text-sm text-muted-foreground max-w-md">
          {t(
            "This module is disabled for your workspace. Enable it in the admin panel under customer features, then refresh.",
            "هذه الوحدة معطلة لمساحة عملك. فعّلها من لوحة الإدارة ضمن ميزات العميل، ثم حدّث الصفحة.",
          )}
        </p>
      </div>
    );
  }
  const permKey = permission ?? feature;
  if (user && user.role !== "admin" && !(user.permissions || []).includes(permKey)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
        <p className="text-lg font-semibold text-foreground">{t("Access denied", "الوصول مرفوض")}</p>
        <p className="text-sm text-muted-foreground max-w-md">
          {t(
            "Your account does not have permission for this module. Ask an administrator to update your permissions.",
            "حسابك لا يملك صلاحية هذه الوحدة. اطلب من المسؤول تحديث صلاحياتك.",
          )}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/p/:token" component={PublicPatientHistory} />
      <Route path="/c/:token" component={PublicEmployeeClock} />
      <Route path="/hr/clock">
        <AuthGuard><ClockKiosk /></AuthGuard>
      </Route>
      <Route>
        <AuthGuard>
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/tasks"><FeatureGate feature="tasks"><Tasks /></FeatureGate></Route>
              <Route path="/crm"><FeatureGate feature="crm"><CRM /></FeatureGate></Route>
              <Route path="/finance"><FeatureGate feature="finance"><Finance /></FeatureGate></Route>
              <Route path="/team"><FeatureGate feature="team"><Team /></FeatureGate></Route>
              <Route path="/hr/attendance"><FeatureGate feature="hr_attendance" permission="team"><AttendancePage /></FeatureGate></Route>
              <Route path="/hr/payroll"><FeatureGate feature="hr_payroll" permission="team"><PayrollPage /></FeatureGate></Route>
              <Route path="/notifications"><FeatureGate feature="notifications"><NotificationsPage /></FeatureGate></Route>
              <Route path="/reports"><FeatureGate feature="reports"><Reports /></FeatureGate></Route>
              <Route path="/products"><FeatureGate feature="products"><Products /></FeatureGate></Route>
              <Route path="/rentals"><FeatureGate feature="rentals"><Rentals /></FeatureGate></Route>
              <Route path="/suppliers"><FeatureGate feature="suppliers"><Suppliers /></FeatureGate></Route>
              <Route path="/purchase-orders"><FeatureGate feature="purchase_orders"><PurchaseOrders /></FeatureGate></Route>
              <Route path="/invoices"><FeatureGate feature="invoicing"><Invoices /></FeatureGate></Route>
              <Route path="/medical/patients"><FeatureGate feature="medical_patients" permission="medical"><Patients /></FeatureGate></Route>
              <Route path="/medical/appointments"><FeatureGate feature="medical_appointments" permission="medical"><Appointments /></FeatureGate></Route>
              <Route path="/medical/visits"><FeatureGate feature="medical_visits" permission="medical"><Visits /></FeatureGate></Route>
              <Route path="/medical/materials"><FeatureGate feature="medical_materials" permission="medical"><MedicalMaterials /></FeatureGate></Route>
              <Route path="/medical/prescriptions"><FeatureGate feature="medical_prescriptions" permission="medical"><Prescriptions /></FeatureGate></Route>
              <Route path="/medical/medicine-master"><FeatureGate feature="medical_medicine_master" permission="medical"><MedicineMaster /></FeatureGate></Route>
              <Route path="/medical/doctor-templates"><FeatureGate feature="medical_rx_templates" permission="medical"><DoctorTemplates /></FeatureGate></Route>
              <Route path="/medical/invoices"><FeatureGate feature="medical_invoices" permission="medical"><MedicalInvoices /></FeatureGate></Route>
              <Route path="/medical/reports"><FeatureGate feature="medical_reports" permission="medical"><MedicalReports /></FeatureGate></Route>
              <Route path="/medical/doctor-availability"><FeatureGate feature="medical_doctor_availability" permission="medical"><DoctorAvailability /></FeatureGate></Route>
              <Route path="/medical/clinic-staff"><FeatureGate feature="clinic_staff" permission="medical"><ClinicStaff /></FeatureGate></Route>
              <Route path="/branches"><FeatureGate feature="branches"><Branches /></FeatureGate></Route>
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function BlockedListener({ children }: { children: React.ReactNode }) {
  const { blocked } = useFeatures();
  const [forced, setForced] = useState(false);
  useEffect(() => {
    const onBlocked = () => setForced(true);
    window.addEventListener("tenant-blocked", onBlocked);
    return () => window.removeEventListener("tenant-blocked", onBlocked);
  }, []);
  if (blocked || forced) return <BlockedPage />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <FeaturesProvider>
              <BlockedListener>
                <AuthProvider>
                  <BrandingProvider>
                  <DeleteConfirmProvider>
                    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                      <AppRouter />
                    </WouterRouter>
                    <Toaster />
                  </DeleteConfirmProvider>
                  </BrandingProvider>
                </AuthProvider>
              </BlockedListener>
            </FeaturesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
