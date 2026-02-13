import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Repository from "./pages/Repository";
import RepositoryDetail from "./pages/RepositoryDetail";
import ApplicationWizard from "./pages/ApplicationWizard";
import ApplicationDetail from "./pages/ApplicationDetail";
import ScreeningQueue from "./pages/ScreeningQueue";
import AssignReviewers from "./pages/AssignReviewers";
import ReviewerAssignments from "./pages/ReviewerAssignments";
import Decisions from "./pages/Decisions";
import Extensions from "./pages/Extensions";
import FinalSubmission from "./pages/FinalSubmission";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AuditLogs from "./pages/AuditLogs";
import LegacyImport from "./pages/LegacyImport";
import ClosureQueue from "./pages/ClosureQueue";
import Profile from "./pages/Profile";
import AdminPortal from "./pages/AdminPortal";
import Notifications from "./pages/Notifications";
import Watchlist from "./pages/Watchlist";
import RepositoryAnalytics from "./pages/RepositoryAnalytics";
import AdminReports from "./pages/AdminReports";
import AdminPartners from "./pages/AdminPartners";
import VerifyApproval from "./pages/VerifyApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
        <Toaster />
        <Sonner />
        <AnnouncementBanner />
        <MaintenanceGuard>
        <BrowserRouter>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <div id="main-content">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/repository" element={<Repository />} />
              <Route path="/repository/:id" element={<RepositoryDetail />} />
              <Route path="/verify/:token" element={<VerifyApproval />} />
              <Route path="/applications/new" element={<ApplicationWizard />} />
              <Route path="/applications/:id/edit" element={<ApplicationWizard />} />
              <Route path="/applications/:id" element={<ApplicationWizard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/applications/:id/manage" element={<ApplicationDetail />} />
              <Route
                path="/screening"
                element={
                  <ProtectedRoute requiredRoles={["ADMIN_OFFICER", "SYSTEM_ADMIN"]}>
                    <ScreeningQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assign"
                element={
                  <ProtectedRoute requiredRoles={["ADMIN_OFFICER", "SYSTEM_ADMIN"]}>
                    <AssignReviewers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews"
                element={
                  <ProtectedRoute requiredRoles={["REVIEWER", "SYSTEM_ADMIN"]}>
                    <ReviewerAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/decisions"
                element={
                  <ProtectedRoute requiredRoles={["EXECUTIVE_DIRECTOR", "SYSTEM_ADMIN"]}>
                    <Decisions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/extensions"
                element={
                  <ProtectedRoute requireStaff>
                    <Extensions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/final-submission/:id"
                element={
                  <ProtectedRoute>
                    <FinalSubmission />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN"]}>
                    <AdminPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN"]}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN"]}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN", "ADMIN_OFFICER"]}>
                    <RepositoryAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/legacy-import"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN"]}>
                    <LegacyImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN"]}>
                    <AdminReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/partners"
                element={
                  <ProtectedRoute requiredRoles={["SYSTEM_ADMIN"]}>
                    <AdminPartners />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/closures"
                element={
                  <ProtectedRoute requiredRoles={["ADMIN_OFFICER", "SYSTEM_ADMIN"]}>
                    <ClosureQueue />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
        </MaintenanceGuard>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
