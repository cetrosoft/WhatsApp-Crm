import React, { useState, useEffect } from 'react';
import { Edit3, X, Send } from 'lucide-react';

export default function EditMessageModal({
  isOpen,
  onClose,
  onSave,
  message,
  isLoading = false
}) {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (isOpen && message) {
      setEditedText(message.text || '');
    }
  }, [isOpen, message]);

  const handleSave = () => {
    if (editedText.trim() && editedText !== message.text) {
      onSave(editedText.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-sm mx-4 max-h-[80vh] flex flex-col" style={{ direction: 'rtl' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Edit3 size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold">تعديل الرسالة</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نص الرسالة:
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ direction: 'rtl' }}
              placeholder="اكتب رسالتك هنا..."
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Character count */}
          <div className="text-xs text-gray-500 mb-4" style={{ direction: 'rtl' }}>
            {editedText.length} حرف
          </div>

          {/* Time limit warning */}
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-2">
            ⏰ يمكن تعديل الرسالة خلال 15 دقيقة من الإرسال فقط
          </div>

          {/* System note */}
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200 mb-4">
            ℹ️ التعديل سيظهر فوراً لجميع المستخدمين المتصلين بالنظام
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={!editedText.trim() || editedText === message?.text || isLoading}
            className="flex-1 p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                جاري الحفظ...
              </div>
            ) : (
              <>
                <Send size={16} />
                حفظ التعديل
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}