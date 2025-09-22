import React from 'react';
import { Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  message,
  isLoading = false
}) {
  if (!isOpen) return null;

  const handleDeleteForMe = () => {
    onConfirm('deleteForMe');
  };

  const handleDeleteForEveryone = () => {
    onConfirm('deleteForEveryone');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4" style={{ direction: 'rtl' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            <h3 className="text-lg font-semibold">حذف الرسالة</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Preview */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border-r-4 border-r-blue-500">
          <div className="text-xs text-gray-500 mb-1">الرسالة المحددة:</div>
          <div className="text-sm">
            {message?.media && (
              <span className="text-blue-600">📎 {message.media.filename || 'ملف مرفق'}</span>
            )}
            {message?.text && (
              <p className="break-words">{message.text.substring(0, 100)}{message.text.length > 100 ? '...' : ''}</p>
            )}
          </div>
        </div>

        {/* Delete Options */}
        <div className="space-y-3">
          <button
            onClick={handleDeleteForMe}
            disabled={isLoading}
            className="w-full p-3 text-right bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <div className="font-medium">حذف لي فقط</div>
            <div className="text-xs text-gray-600">ستحذف الرسالة من جهازك فقط</div>
          </button>

          {message?.sender === "me" && (
            <button
              onClick={handleDeleteForEveryone}
              disabled={isLoading}
              className="w-full p-3 text-right bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-red-700">حذف للجميع</div>
              <div className="text-xs text-red-600">ستحذف الرسالة من جميع الأجهزة</div>
            </button>
          )}
        </div>

        {/* Cancel Button */}
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              جاري الحذف...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}