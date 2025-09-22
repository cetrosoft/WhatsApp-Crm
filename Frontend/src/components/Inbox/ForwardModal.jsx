import React, { useState, useEffect } from 'react';
import { Forward, X, Search, Check } from 'lucide-react';

export default function ForwardModal({
  isOpen,
  onClose,
  onForward,
  message,
  isLoading = false
}) {
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const response = await fetch('http://localhost:5000/all-chats');
      const data = await response.json();
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
    setLoadingChats(false);
  };

  const handleChatToggle = (chat) => {
    setSelectedChats(prev => {
      const isSelected = prev.find(c => c.id === chat.id);
      if (isSelected) {
        return prev.filter(c => c.id !== chat.id);
      } else {
        return [...prev, chat];
      }
    });
  };

  const handleForward = () => {
    if (selectedChats.length > 0) {
      onForward(selectedChats);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-sm mx-4 max-h-[80vh] flex flex-col" style={{ direction: 'rtl' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Forward size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold">إعادة توجيه الرسالة</h3>
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
        <div className="p-4 border-b bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">الرسالة:</div>
          <div className="bg-white p-2 rounded border">
            {message?.media && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-600 text-sm">📎 {message.media.filename || 'ملف مرفق'}</span>
              </div>
            )}
            {message?.text && (
              <p className="text-sm break-words">{message.text.substring(0, 100)}{message.text.length > 100 ? '...' : ''}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في المحادثات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ direction: 'rtl' }}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              جاري تحميل المحادثات...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              لا توجد محادثات
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedChats.find(c => c.id === chat.id);
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatToggle(chat)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    chat.isGroup ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {chat.isGroup ? '👥' : (chat.name ? chat.name.charAt(0).toUpperCase() : '👤')}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{chat.name}</div>
                    {chat.isGroup && (
                      <div className="text-xs text-gray-500">جروب</div>
                    )}
                  </div>

                  {/* Selection Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Count */}
        {selectedChats.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-t">
            <div className="text-sm text-blue-700">
              تم اختيار {selectedChats.length} محادثة
            </div>
          </div>
        )}

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
            onClick={handleForward}
            disabled={selectedChats.length === 0 || isLoading}
            className="flex-1 p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-400"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                جاري الإرسال...
              </div>
            ) : (
              `إرسال (${selectedChats.length})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}