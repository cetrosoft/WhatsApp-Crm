import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Contexts
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";

// Components
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages - Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import AcceptInvitation from "./pages/AcceptInvitation";
import ResetPassword from "./pages/ResetPassword";

// Pages - Dashboard
import Dashboard from "./pages/dashboard";
import Campaigns from "./pages/Campaigns";
import Settings from "./pages/Settings";
import Inbox from "./pages/Inbox";
import AccountSettings from "./pages/AccountSettings";
import Contacts from "./pages/Contacts";
import CRMSettings from "./pages/CRMSettings";
import Segments from "./pages/Segments";
import Companies from "./pages/Companies";

// Pages - Team
import TeamMembers from "./pages/Team/TeamMembers";
import RolesPermissions from "./pages/Team/RolesPermissions";
import CreateRole from "./pages/CreateRole";

import menuConfig from "./menuConfig";

// Map between component names and actual code
const componentsMap = {
  Dashboard,
  Campaigns,
  Settings,
  Inbox,
  AccountSettings,
};

// Main Layout for Protected Pages
const MainLayout = () => {
  return (
    <DashboardLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* CRM */}
        <Route path="/crm/contacts" element={<Contacts />} />
        <Route path="/crm/companies" element={<Companies />} />
        <Route path="/crm/segmentation" element={<Segments />} />
        <Route path="/crm/settings" element={<CRMSettings />} />

        {/* Team */}
        <Route path="/team/members" element={<TeamMembers />} />
        <Route path="/team/roles" element={<RolesPermissions />} />
        <Route path="/team/roles/create" element={<CreateRole />} />
        <Route path="/team/roles/edit/:roleId" element={<CreateRole />} />

        {/* Old routes - will be migrated to new structure */}
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/account-settings" element={<AccountSettings />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          {/* Toast Notifications */}
          <Toaster position="top-center" />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
