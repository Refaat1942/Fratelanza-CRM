import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { userHasPermission } from "@/lib/userPermissions";
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
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import BlockedPage from "@/pages/blocked";
import { DeleteConfirmProvider } from "@/components/DeleteConfirmProvider";

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
  if (loading) return null;
  // Tenant-level: feature must be enabled for the workspace.
  if (features[feature] === false) return <NotFound />;
  // User-level: non-admins need the permission in their assigned list.
  // `permission` defaults to `feature` but can be overridden (e.g. dental shares medical permission).
  const permKey = permission ?? feature;
  if (user && user.role !== "admin" && !userHasPermission(user.permissions, permKey)) {
    return <NotFound />;
  }
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/p/:token" component={PublicPatientHistory} />
      <Route>
        <AuthGuard>
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/tasks"><FeatureGate feature="tasks"><Tasks /></FeatureGate></Route>
              <Route path="/crm"><FeatureGate feature="crm"><CRM /></FeatureGate></Route>
              <Route path="/finance"><FeatureGate feature="finance"><Finance /></FeatureGate></Route>
              <Route path="/team"><FeatureGate feature="team"><Team /></FeatureGate></Route>
              <Route path="/notifications"><FeatureGate feature="notifications"><NotificationsPage /></FeatureGate></Route>
              <Route path="/reports"><FeatureGate feature="reports"><Reports /></FeatureGate></Route>
              <Route path="/products"><FeatureGate feature="products"><Products /></FeatureGate></Route>
              <Route path="/rentals"><FeatureGate feature="rentals"><Rentals /></FeatureGate></Route>
              <Route path="/suppliers"><FeatureGate feature="suppliers"><Suppliers /></FeatureGate></Route>
              <Route path="/purchase-orders"><FeatureGate feature="purchase_orders"><PurchaseOrders /></FeatureGate></Route>
              <Route path="/invoices"><FeatureGate feature="invoicing"><Invoices /></FeatureGate></Route>
              <Route path="/medical/patients"><FeatureGate feature="medical_patients" permission="medical_patients"><Patients /></FeatureGate></Route>
              <Route path="/medical/appointments"><FeatureGate feature="medical_appointments" permission="medical_appointments"><Appointments /></FeatureGate></Route>
              <Route path="/medical/visits"><FeatureGate feature="medical_visits" permission="medical_visits"><Visits /></FeatureGate></Route>
              <Route path="/medical/materials"><FeatureGate feature="medical_materials" permission="medical_materials"><MedicalMaterials /></FeatureGate></Route>
              <Route path="/medical/prescriptions"><FeatureGate feature="medical_prescriptions" permission="medical_prescriptions"><Prescriptions /></FeatureGate></Route>
              <Route path="/medical/medicine-master"><FeatureGate feature="medical_medicine_master" permission="medical_medicine_master"><MedicineMaster /></FeatureGate></Route>
              <Route path="/medical/doctor-templates"><FeatureGate feature="medical_rx_templates" permission="medical_rx_templates"><DoctorTemplates /></FeatureGate></Route>
              <Route path="/medical/invoices"><FeatureGate feature="medical_invoices" permission="medical_invoices"><MedicalInvoices /></FeatureGate></Route>
              <Route path="/medical/reports"><FeatureGate feature="medical_reports" permission="medical_reports"><MedicalReports /></FeatureGate></Route>
              <Route path="/medical/doctor-availability"><FeatureGate feature="medical_doctor_availability" permission="medical_doctor_availability"><DoctorAvailability /></FeatureGate></Route>
              <Route path="/medical/clinic-staff"><FeatureGate feature="clinic_staff" permission="clinic_staff"><ClinicStaff /></FeatureGate></Route>
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
