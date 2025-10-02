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
  onResume,
  onStop,
  isPaused,
  isRunning,
  loading,
  campaignProgress,
  disabled
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

      {/* Campaign Progress */}
      {isRunning && campaignProgress && campaignProgress.total > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">تقدم الحملة</span>
            <span className="text-sm text-blue-600">
              {campaignProgress.current} / {campaignProgress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(campaignProgress.current / campaignProgress.total) * 100}%`
              }}
            ></div>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {Math.round((campaignProgress.current / campaignProgress.total) * 100)}% مكتمل
          </div>
        </div>
      )}

      {/* أزرار */}
      <button
        className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={onPreview}
        disabled={loading || disabled}
      >
        👁️ معاينة
      </button>

      <button
        className={`w-full text-white py-2 rounded-md transition mb-2 ${
          loading || disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
        onClick={onSend}
        disabled={loading || isRunning || disabled}
      >
        {loading && isRunning ? "⏳ جارٍ الإرسال..." : "🚀 بدء الإرسال"}
      </button>

      {/* Pause/Resume Button */}
      {isRunning && (
        <button
          className={`w-full text-white py-2 rounded-md transition mb-2 ${
            isPaused
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
          onClick={isPaused ? onResume : onPause}
          disabled={false}
        >
          {isPaused ? "▶️ استئناف الحملة" : "⏸️ إيقاف مؤقت"}
        </button>
      )}

      {/* Stop Button */}
      {isRunning && (
        <button
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition"
          onClick={onStop}
        >
          🛑 إيقاف الحملة نهائياً
        </button>
      )}
    </div>
  );
}
