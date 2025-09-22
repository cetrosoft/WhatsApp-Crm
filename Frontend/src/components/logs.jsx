import React from "react";

export default function Logs({ log, allChats }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md overflow-y-auto max-h-[500px]">
      <h2 className="text-xl font-semibold mb-4">سجل الإرسال</h2>
      <ul className="list-disc pl-5 space-y-1">
        {log.length === 0 ? (
          <p className="text-gray-500">⏳ لا توجد أي رسائل مرسلة بعد...</p>
        ) : (
          log.map((r, i) => {
            const chat =
              allChats.find((c) => c.id === r.id || c.id === r.target) || {};
            const displayName = chat.name || "بدون اسم";
            return (
              <li key={i}>
                {r.type === "individual" ? "👤" : "👥"} {displayName} (
                {r.id || r.target}){" "}
                {r.status === "تم الإرسال" ? "✅" : "❌"} {r.status} ⏰{" "}
                {r.time}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
