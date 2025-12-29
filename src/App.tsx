import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PatientProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pacientes/novo" element={<NewPatient />} />
              <Route path="/pacientes/:id" element={<EditPatient />} />
              <Route path="/agendamentos" element={<Appointments />} />
              <Route path="/fechados" element={<ClosedDeals />} />
              <Route path="/sem-interesse" element={<NoInterest />} />
              <Route path="/contatos" element={<AllContacts />} />
              <Route path="/exportar" element={<Export />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </PatientProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
