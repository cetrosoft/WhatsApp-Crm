import React from "react";
import { Link, useLocation } from "react-router-dom";
import menuConfig from "../menuConfig";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div
      className={`h-screen bg-[#464775] text-white flex flex-col transition-all duration-300 font-cairo shadow-lg
        ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#5a5d8a]">
        {isOpen && <h1 className="text-xl font-bold">💬 WhatsApp CRM</h1>}
        <button
          className="p-2 rounded hover:bg-[#5a5d8a] transition-colors"
          onClick={toggleSidebar}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 flex flex-col space-y-1 p-3">
        {menuConfig.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              location.pathname === item.path
                ? "bg-[#6264a7] text-white font-semibold shadow-sm"
                : "hover:bg-[#5a5d8a] hover:text-white"
            }`}
          >
            {/* أيقونة */}
            <span className="text-lg">{item.icon}</span>

            {/* النص يظهر فقط لما القائمة مفتوحة */}
            {isOpen && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer: Language Switcher & Logout */}
      <div className="p-3 border-t border-[#5a5d8a] space-y-2">
        {/* Language Switcher */}
        <div className="flex items-center justify-center">
          <LanguageSwitcher />
        </div>

        {/* Logout Button */}
        {isOpen && (
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#5a5d8a] transition-colors text-start"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        )}
        {!isOpen && (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-[#5a5d8a] transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
