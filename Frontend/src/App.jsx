import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import Settings from "./pages/Settings";
import menuConfig from "./menuConfig";
import Inbox from "./pages/Inbox";

// Map بين أسماء الكومبوننتس والكود الفعلي
const componentsMap = {
  Dashboard,
  Campaigns,
  Settings,
  Inbox, 
};

export default function App() {
  // الحالة بتتحكم في فتح/قفل القائمة
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <Router>
      {/* Toast Notifications شغال على مستوى التطبيق كله */}
      <Toaster position="top-center" />

      <div className="flex" style={{ maxWidth: '100vw', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content */}
        <div
          className="flex-1 bg-gray-50 min-h-screen p-4 sm:p-6 md:p-10 font-cairo transition-all duration-300"
          style={{ maxWidth: 'calc(100vw - 250px)', overflow: 'hidden', minWidth: '0' }}
        >
          <Routes>
            {menuConfig.map((item) => {
              const Component = componentsMap[item.component];
              return (
                <Route
                  key={item.path}
                  path={item.path}
                  element={<Component />}
                />
              );
            })}
          </Routes>
        </div>
      </div>
    </Router>
  );
}
