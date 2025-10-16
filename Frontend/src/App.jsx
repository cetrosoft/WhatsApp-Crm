import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Contexts
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SuperAdminProvider } from "./contexts/SuperAdminContext";

// Components
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import PermissionRoute from "./components/PermissionRoute";

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
import Deals from "./pages/Deals";
import Pipelines from "./pages/Pipelines";
import Tickets from "./pages/Tickets";
import TicketSettings from "./pages/TicketSettings";

// Pages - Team
import TeamMembers from "./pages/Team/TeamMembers";
import RolesPermissions from "./pages/Team/RolesPermissions";
import CreateRole from "./pages/CreateRole";

// Pages - User Profile
import UserProfile from "./pages/UserProfile";

// Debug Pages
import DebugPermissions from "./pages/DebugPermissions";

// Super Admin Pages
import SuperAdminLayout from "./components/SuperAdmin/SuperAdminLayout";
import SuperAdminLogin from "./pages/SuperAdmin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";
import Organizations from "./pages/SuperAdmin/Organizations";
import Packages from "./pages/SuperAdmin/Packages";
import Menus from "./pages/SuperAdmin/Menus";

import menuConfig from "./menuConfig";

// Map between component names and actual code
const componentsMap = {
  Dashboard,
  Campaigns,
  Settings,
  Inbox,
  AccountSettings,
};

// Main Layout for Organization Protected Pages
const MainLayout = () => {
  return (
    <DashboardLayout>
      <Routes>
        {/* Dashboard - no permission required, all users can access */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* CRM - Permission Protected */}
        <Route
          path="/crm/contacts"
          element={
            <PermissionRoute permission="contacts.view">
              <Contacts />
            </PermissionRoute>
          }
        />
        <Route
          path="/crm/companies"
          element={
            <PermissionRoute permission="companies.view">
              <Companies />
            </PermissionRoute>
          }
        />
        <Route
          path="/crm/segmentation"
          element={
            <PermissionRoute permission="segments.view">
              <Segments />
            </PermissionRoute>
          }
        />
        <Route
          path="/crm/deals"
          element={
            <PermissionRoute permission="deals.view">
              <Deals />
            </PermissionRoute>
          }
        />
        <Route
          path="/crm/pipelines"
          element={
            <PermissionRoute permission="pipelines.view">
              <Pipelines />
            </PermissionRoute>
          }
        />
        <Route
          path="/crm/settings"
          element={
            <PermissionRoute permission="statuses.view">
              <CRMSettings />
            </PermissionRoute>
          }
        />

        {/* Tickets - Permission Protected */}
        <Route
          path="/tickets"
          element={
            <PermissionRoute permission="tickets.view">
              <Tickets />
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/settings"
          element={
            <PermissionRoute permission="ticket_categories.manage">
              <TicketSettings />
            </PermissionRoute>
          }
        />

        {/* Team - Permission Protected */}
        <Route
          path="/team/members"
          element={
            <PermissionRoute permission="users.view">
              <TeamMembers />
            </PermissionRoute>
          }
        />
        <Route
          path="/team/roles"
          element={
            <PermissionRoute permission="permissions.manage">
              <RolesPermissions />
            </PermissionRoute>
          }
        />
        <Route
          path="/team/roles/create"
          element={
            <PermissionRoute permission="permissions.manage">
              <CreateRole />
            </PermissionRoute>
          }
        />
        <Route
          path="/team/roles/edit/:roleId"
          element={
            <PermissionRoute permission="permissions.manage">
              <CreateRole />
            </PermissionRoute>
          }
        />

        {/* User Profile - no permission required */}
        <Route path="/profile" element={<UserProfile />} />

        {/* Old routes - will be migrated to new structure */}
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/account-settings"
          element={
            <PermissionRoute permission="organization.edit">
              <AccountSettings />
            </PermissionRoute>
          }
        />

        {/* Debug Page - Remove in production */}
        <Route path="/debug-permissions" element={<DebugPermissions />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

// Super Admin Layout for Platform Administration
const SuperAdminLayoutWrapper = () => {
  return (
    <SuperAdminLayout>
      <Routes>
        {/* Super Admin Dashboard */}
        <Route path="/dashboard" element={<SuperAdminDashboard />} />

        {/* Organizations Management */}
        <Route path="/organizations" element={<Organizations />} />

        {/* Package Management */}
        <Route path="/packages" element={<Packages />} />

        {/* Menu Management */}
        <Route path="/menus" element={<Menus />} />

        {/* TODO: Add more super admin routes as needed */}
        {/* <Route path="/activity" element={<ActivityLogs />} /> */}

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
      </Routes>
    </SuperAdminLayout>
  );
};

export default function App() {
  return (
    <Router>
      {/* Toast Notifications - Global */}
      <Toaster position="top-center" />

      <Routes>
        {/* ============================================ */}
        {/* SUPER ADMIN ROUTES (Separate Auth System) */}
        {/* ============================================ */}
        <Route
          path="/super-admin/*"
          element={
            <SuperAdminProvider>
              <Routes>
                {/* Super Admin Login (Public) */}
                <Route path="/login" element={<SuperAdminLogin />} />

                {/* Super Admin Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <SuperAdminProtectedRoute>
                      <SuperAdminLayoutWrapper />
                    </SuperAdminProtectedRoute>
                  }
                />
              </Routes>
            </SuperAdminProvider>
          }
        />

        {/* ============================================ */}
        {/* ORGANIZATION ROUTES (Standard Auth System) */}
        {/* ============================================ */}
        <Route
          path="/*"
          element={
            <AuthProvider>
              <LanguageProvider>
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
          }
        />
      </Routes>
    </Router>
  );
}
