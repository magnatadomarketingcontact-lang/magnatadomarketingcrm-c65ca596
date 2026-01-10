import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PatientProvider } from "@/contexts/PatientContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import NewPatient from "./pages/NewPatient";
import EditPatient from "./pages/EditPatient";
import Appointments from "./pages/Appointments";
import ClosedDeals from "./pages/ClosedDeals";
import NoInterest from "./pages/NoInterest";
import AllContacts from "./pages/AllContacts";
import Export from "./pages/Export";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <PatientProvider>
      <Routes>
        <Route path="/auth" element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Index /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/pacientes/novo" element={
          <ProtectedRoute>
            <AppLayout><NewPatient /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/pacientes/:id" element={
          <ProtectedRoute>
            <AppLayout><EditPatient /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agendamentos" element={
          <ProtectedRoute>
            <AppLayout><Appointments /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/fechados" element={
          <ProtectedRoute>
            <AppLayout><ClosedDeals /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/sem-interesse" element={
          <ProtectedRoute>
            <AppLayout><NoInterest /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/contatos" element={
          <ProtectedRoute>
            <AppLayout><AllContacts /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/exportar" element={
          <ProtectedRoute>
            <AppLayout><Export /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PatientProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
