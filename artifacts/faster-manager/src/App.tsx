import { ProtectedRoute } from "@/components/protected-route";
import { Layout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeNew from "@/pages/employee-new";
import EmployeeDetail from "@/pages/employee-detail";
import EmployeeEdit from "@/pages/employee-edit";
import CompanyDocuments from "@/pages/company-documents";
import Expirations from "@/pages/expirations";
import Activities from "@/pages/activities";
import SearchPage from "@/pages/search";
import Backup from "@/pages/backup";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <ProtectedRoute>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/employees/new" component={EmployeeNew} />
              <Route path="/employees/:id/edit" component={EmployeeEdit} />
              <Route path="/employees/:id" component={EmployeeDetail} />
              <Route path="/employees" component={Employees} />
              <Route path="/company-documents" component={CompanyDocuments} />
              <Route path="/expirations" component={Expirations} />
              <Route path="/activities" component={Activities} />
              <Route path="/search" component={SearchPage} />
              <Route path="/backup" component={Backup} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
