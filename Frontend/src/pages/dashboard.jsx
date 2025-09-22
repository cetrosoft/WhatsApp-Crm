import React from "react";
import StatsCard from "../components/StatsCard";

export default function Dashboard() {
  // مثال - ممكن بعدين تجيب البيانات من الباك إند
  const total = 150;
  const success = 120;
  const failed = 30;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📊 إحصائيات عامة</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="إجمالي الرسائل" value={total} color="blue" />
        <StatsCard title="تم الإرسال" value={success} color="green" />
        <StatsCard title="فشلت" value={failed} color="red" />
      </div>
    </div>
  );
}
