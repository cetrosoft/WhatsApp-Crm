import React from "react";
import MessageForm from "../components/MessageForm";
import ContactsList from "../components/ContactsList";
import Logs from "../components/Logs";

export default function Campaigns() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📩 حملات واتس</h2>
      {/* هنربطها مع الـ state و App بعدين */}
      <p>هنا هتكون أدوات إنشاء الحملة + الإرسال + السجل.</p>
    </div>
  );
}
