import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudyAnalysisPage from "./pages/StudyAnalysisPage";
import PatientsPage from "./pages/PatientsPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute permission="view:dashboard">
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/studies"
              element={
                <ProtectedRoute permission="view:studies">
                  <AppLayout><StudyAnalysisPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute permission="view:patients">
                  <AppLayout><PatientsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:studyId"
              element={
                <ProtectedRoute permission="view:patients">
                  <AppLayout><PatientProfilePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
