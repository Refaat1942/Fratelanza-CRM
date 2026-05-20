import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { FeaturesProvider, useFeatures } from "@/components/FeaturesProvider";
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
import Procedures from "@/pages/medical/procedures";
import MedicalInvoices from "@/pages/medical/invoices";
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

function FeatureGate({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { features, loading } = useFeatures();
  const { user } = useAuth();
  if (loading) return null;
  // Tenant-level: feature must be enabled for the workspace.
  if (features[feature] === false) return <NotFound />;
  // User-level: non-admins need the permission in their assigned list.
  if (user && user.role !== "admin" && !(user.permissions || []).includes(feature)) {
    return <NotFound />;
  }
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
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
              <Route path="/medical/patients"><FeatureGate feature="medical"><Patients /></FeatureGate></Route>
              <Route path="/medical/appointments"><FeatureGate feature="medical"><Appointments /></FeatureGate></Route>
              <Route path="/medical/visits"><FeatureGate feature="medical"><Visits /></FeatureGate></Route>
              <Route path="/medical/procedures"><FeatureGate feature="medical"><Procedures /></FeatureGate></Route>
              <Route path="/medical/invoices"><FeatureGate feature="medical"><MedicalInvoices /></FeatureGate></Route>
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
                  <DeleteConfirmProvider>
                    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                      <AppRouter />
                    </WouterRouter>
                    <Toaster />
                  </DeleteConfirmProvider>
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
