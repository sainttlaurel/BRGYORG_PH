import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { DataProvider } from "./components/DataContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { queryClient } from "../lib/queryClient";

// Layouts
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";

// Public pages
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

// Admin pages
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminResidents from "./components/AdminResidents";
import AdminRequests from "./components/AdminRequests";
import AdminBlotter from "./components/AdminBlotter";
import AdminOfficials from "./components/AdminOfficials";
import AdminAnnouncements from "./components/AdminAnnouncements";
import AdminPolls from "./components/AdminPolls";
import AdminReports from "./components/AdminReports";
import AdminConcerns from "./components/AdminConcerns";
import AdminUsers from "./components/AdminUsers";
import AdminAuditLogs from "./components/AdminAuditLogs";
import AdminSettings from "./components/AdminSettings";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const ThemedToaster: React.FC = () => {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
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
        {/* Public routes */}
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
        </Route>

        {/* Admin login (standalone, no layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="residents" element={<AdminResidents />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="blotter" element={<AdminBlotter />} />
          <Route path="officials" element={<AdminOfficials />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="polls" element={<AdminPolls />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="concerns" element={<AdminConcerns />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ThemedToaster />
    </BrowserRouter>
  );
};

export default function App() {
  return (
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
  );
}
