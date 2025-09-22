import React from "react";

export default function PreviewModal({ show, onClose, message, imageFile }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">📋 معاينة الرسالة</h2>

        {/* نص الرسالة */}
        <p className="mb-3 whitespace-pre-wrap">{message}</p>

        {/* الصورة */}
        {imageFile && (
          <div className="mb-3">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="max-w-full max-h-60 rounded-md border mb-2"
            />
            <p className="text-sm text-gray-500">
              {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
            </p>
          </div>
        )}

        {/* الأزرار */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
