import React from "react";

export default function ContactsList({
  allChats,
  selectedChats,
  toggleChat,
  toggleSelectAll,
  filter,
  setFilter,
  typeFilter,
  setTypeFilter,
}) {
  // فلترة وترتيب
  const filteredChats = allChats
    .filter((c) => {
      const matchText = c.name
        .toLowerCase()
        .includes(filter.toLowerCase());
      const matchType =
        typeFilter === "all" ||
        (typeFilter === "groups" && c.isGroup) ||
        (typeFilter === "individuals" && !c.isGroup);
      return matchText && matchType;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      {/* بحث + فلترة */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="🔍 بحث..."
          className="flex-1 border border-gray-300 rounded-md p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-md p-2"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">الكل</option>
          <option value="individuals">أفراد</option>
          <option value="groups">جروبات</option>
        </select>
      </div>

      {/* اختيار الكل */}
      <button
        className="mb-3 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => toggleSelectAll(filteredChats)}
      >
        {filteredChats.every((c) => selectedChats.includes(c.id))
          ? "🔽 إلغاء تحديد الكل"
          : "✅ تحديد الكل"}
      </button>

      {/* قائمة الأفراد والجروبات */}
      <h2 className="text-lg font-semibold mb-2">
        الأفراد والجروبات ({selectedChats.length} مختارة)
      </h2>
      <div className="border rounded p-3 mb-3 max-h-40 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <p className="text-gray-500">⏳ لا توجد نتائج...</p>
        ) : (
          filteredChats.map((c) => (
            <label key={c.id} className="block">
              <input
                type="checkbox"
                checked={selectedChats.includes(c.id)}
                onChange={() => toggleChat(c.id)}
              />{" "}
              {c.isGroup ? "👥" : "👤"} {c.name}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
