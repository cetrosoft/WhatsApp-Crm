import React from "react";
import { BarChart, MessageSquare, Settings, Inbox } from "lucide-react";

const menuConfig = [
  {
    path: "/",
    label: "Dashboard",
    icon: <BarChart size={20} />,
    component: "Dashboard",
  },
  {
    path: "/campaigns",
    label: "حملات واتس",
    icon: <MessageSquare size={20} />,
    component: "Campaigns",
  },
  {
    path: "/inbox",
    label: "الرسائل الواردة",
    icon: <Inbox size={20} />, // ✅ كده هيشتغل
    component: "Inbox",
  },
  {
    path: "/settings",
    label: "الإعدادات",
    icon: <Settings size={20} />,
    component: "Settings",
  },
];

export default menuConfig;
