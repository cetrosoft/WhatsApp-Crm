import React from "react";

export default function MessageForm({
  message,
  setMessage,
  imageFile,
  setImageFile,
  delayMin,
  setDelayMin,
  delayMax,
  setDelayMax,
  onPreview,
  onSend,
  onPause,
  isPaused,
  isRunning,
  loading,
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">إرسال رسالة</h2>

      {/* نص الرسالة */}
      <textarea
        className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-2 focus:ring-green-400"
        rows={3}
        placeholder="اكتب نص الرسالة هنا..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {/* صورة + إلغاء + حجم */}
      {imageFile ? (
        <div className="mb-3 flex items-center justify-between bg-gray-100 p-2 rounded">
          <span>
            📷 {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
          </span>
          <button
            className="text-red-500 hover:underline"
            onClick={() => setImageFile(null)}
          >
            إلغاء
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/*"
          className="w-full mb-3"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      )}

      {/* Delay Min + Max */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 font-medium">Delay الأدنى (ms)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-400"
            value={delayMin}
            onChange={(e) => setDelayMin(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Delay الأقصى (ms)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-400"
            value={delayMax}
            onChange={(e) => setDelayMax(Number(e.target.value))}
          />
        </div>
      </div>

      {/* أزرار */}
      <button
        className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition mb-2"
        onClick={onPreview}
        disabled={loading}
      >
        👁️ معاينة
      </button>

      <button
        className={`w-full text-white py-2 rounded-md transition mb-2 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
        onClick={onSend}
        disabled={loading || isRunning}
      >
        {loading && isRunning ? "⏳ جارٍ الإرسال..." : "🚀 بدء الإرسال"}
      </button>

      <button
        className={`w-full text-white py-2 rounded-md transition mb-2 ${
          isPaused
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-red-500 hover:bg-red-600"
        }`}
        onClick={isPaused ? onSend : onPause}
        disabled={!isRunning}
      >
        {isPaused ? "▶️ استئناف" : "⏸️ إيقاف مؤقت"}
      </button>
    </div>
  );
}
