/**
 * Dashboard Layout
 * Main layout wrapper with Topbar + Sidebar + Content
 * Fully supports RTL (Arabic) and LTR (English)
 */

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar - Fixed at top */}
      <Topbar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      <div className="flex pt-16">
        {/* Sidebar - Desktop: Fixed left/right, Mobile: Overlay */}
        <Sidebar
          isOpen={sidebarOpen}
          mobileOpen={mobileSidebarOpen}
          closeMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'lg:ms-64' : 'lg:ms-20'
          }`}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
