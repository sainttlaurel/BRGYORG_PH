import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { DataProvider } from "./components/DataContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { queryClient } from "../lib/queryClient";

import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";

import PublicHome from "./components/PublicHome";
import PublicAbout from "./components/PublicAbout";
import PublicOfficials from "./components/PublicOfficials";
import PublicServices from "./components/PublicServices";
import PublicDocumentApplication from "./components/PublicDocumentApplication";
import PublicRegistry from "./components/PublicRegistry";
import PublicAnnouncements from "./components/PublicAnnouncements";
import PublicCitizensVoice from "./components/PublicCitizensVoice";
import PublicCommunityVote from "./components/PublicCommunityVote";
import PublicVolunteer from "./components/PublicVolunteer";
import PublicReportConcern from "./components/PublicReportConcern";
import PublicContact from "./components/PublicContact";
import PublicBusinessRegistry from "./components/PublicBusinessRegistry";
import PublicProjects from "./components/PublicProjects";
import PublicClearanceRequest from "./components/PublicClearanceRequest";

const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const AdminResidents = lazy(() => import("./components/AdminResidents"));
const AdminRequests = lazy(() => import("./components/AdminRequests"));
const AdminBlotter = lazy(() => import("./components/AdminBlotter"));
const AdminOfficials = lazy(() => import("./components/AdminOfficials"));
const AdminAnnouncements = lazy(() => import("./components/AdminAnnouncements"));
const AdminPolls = lazy(() => import("./components/AdminPolls"));
const AdminReports = lazy(() => import("./components/AdminReports"));
const AdminConcerns = lazy(() => import("./components/AdminConcerns"));
const AdminSuggestions = lazy(() => import("./components/AdminSuggestions"));
const AdminVolunteers = lazy(() => import("./components/AdminVolunteers"));
const AdminUsers = lazy(() => import("./components/AdminUsers"));
const AdminContactMessages = lazy(() => import("./components/AdminContactMessages"));
const AdminAuditLogs = lazy(() => import("./components/AdminAuditLogs"));
const AdminBusinessRegistry = lazy(() => import("./components/AdminBusinessRegistry"));
const AdminProjects = lazy(() => import("./components/AdminProjects"));
const AdminClearanceRequests = lazy(() => import("./components/AdminClearanceRequests"));

const AdminSettings = lazy(() => import("./components/AdminSettings"));
import { getVisiblePaths } from "./components/AdminLayout";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const RoleRoute: React.FC<{ children: React.ReactNode; path: string }> = ({ children, path }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!user || !getVisiblePaths(user.role).includes(path)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

const NotFoundPage = lazy(() => import("./components/NotFoundPage"));
const AdminFallback: React.FC = () => (
  <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>
);

const ThemedToaster: React.FC = () => {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={(theme === "dark" || theme === "light") ? theme : undefined}
      position="bottom-right"
      toastOptions={{
        style: { borderRadius: "0.875rem", fontSize: "0.875rem" },
      }}
    />
  );
};

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        { }
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<PublicHome />} />
          <Route path="about" element={<PublicAbout />} />
          <Route path="officials" element={<PublicOfficials />} />
          <Route path="services" element={<PublicServices />} />
          <Route path="document-application" element={<PublicDocumentApplication />} />
          <Route path="registry" element={<PublicRegistry />} />
          <Route path="announcements" element={<PublicAnnouncements />} />
          <Route path="citizens-voice" element={<PublicCitizensVoice />} />
          <Route path="community-vote" element={<PublicCommunityVote />} />
          <Route path="volunteer" element={<PublicVolunteer />} />
          <Route path="report-concern" element={<PublicReportConcern />} />
          <Route path="contact" element={<PublicContact />} />
          <Route path="business-registry" element={<PublicBusinessRegistry />} />
          <Route path="projects" element={<PublicProjects />} />
          <Route path="clearance-request" element={<PublicClearanceRequest />} />
        </Route>

        { }
        <Route path="/admin/login" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
            <AdminLogin />
          </Suspense>
        } />

        { }
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<RoleRoute path="/admin/dashboard"><Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense></RoleRoute>} />
          <Route path="residents" element={<RoleRoute path="/admin/residents"><Suspense fallback={<AdminFallback />}><AdminResidents /></Suspense></RoleRoute>} />
          <Route path="requests" element={<RoleRoute path="/admin/requests"><Suspense fallback={<AdminFallback />}><AdminRequests /></Suspense></RoleRoute>} />
          <Route path="blotter" element={<RoleRoute path="/admin/blotter"><Suspense fallback={<AdminFallback />}><AdminBlotter /></Suspense></RoleRoute>} />
          <Route path="officials" element={<RoleRoute path="/admin/officials"><Suspense fallback={<AdminFallback />}><AdminOfficials /></Suspense></RoleRoute>} />
          <Route path="announcements" element={<RoleRoute path="/admin/announcements"><Suspense fallback={<AdminFallback />}><AdminAnnouncements /></Suspense></RoleRoute>} />
          <Route path="polls" element={<RoleRoute path="/admin/polls"><Suspense fallback={<AdminFallback />}><AdminPolls /></Suspense></RoleRoute>} />
          <Route path="reports" element={<RoleRoute path="/admin/reports"><Suspense fallback={<AdminFallback />}><AdminReports /></Suspense></RoleRoute>} />
          <Route path="concerns" element={<RoleRoute path="/admin/concerns"><Suspense fallback={<AdminFallback />}><AdminConcerns /></Suspense></RoleRoute>} />
          <Route path="suggestions" element={<RoleRoute path="/admin/suggestions"><Suspense fallback={<AdminFallback />}><AdminSuggestions /></Suspense></RoleRoute>} />
          <Route path="volunteers" element={<RoleRoute path="/admin/volunteers"><Suspense fallback={<AdminFallback />}><AdminVolunteers /></Suspense></RoleRoute>} />
          <Route path="contact-messages" element={<RoleRoute path="/admin/contact-messages"><Suspense fallback={<AdminFallback />}><AdminContactMessages /></Suspense></RoleRoute>} />
          <Route path="users" element={<RoleRoute path="/admin/users"><Suspense fallback={<AdminFallback />}><AdminUsers /></Suspense></RoleRoute>} />
          <Route path="audit-logs" element={<RoleRoute path="/admin/audit-logs"><Suspense fallback={<AdminFallback />}><AdminAuditLogs /></Suspense></RoleRoute>} />
          <Route path="business-registry" element={<RoleRoute path="/admin/business-registry"><Suspense fallback={<AdminFallback />}><AdminBusinessRegistry /></Suspense></RoleRoute>} />
          <Route path="projects" element={<RoleRoute path="/admin/projects"><Suspense fallback={<AdminFallback />}><AdminProjects /></Suspense></RoleRoute>} />
          <Route path="clearance-requests" element={<RoleRoute path="/admin/clearance-requests"><Suspense fallback={<AdminFallback />}><AdminClearanceRequests /></Suspense></RoleRoute>} />

          <Route path="settings" element={<RoleRoute path="/admin/settings"><Suspense fallback={<AdminFallback />}><AdminSettings /></Suspense></RoleRoute>} />
          <Route path="*" element={
            <Suspense fallback={<AdminFallback />}>
              <NotFoundPage />
            </Suspense>
          } />
        </Route>

        { }
        <Route path="*" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
            <NotFoundPage />
          </Suspense>
        } />
      </Routes>

      <ThemedToaster />
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <DataProvider>
                <AppRoutes />
              </DataProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
