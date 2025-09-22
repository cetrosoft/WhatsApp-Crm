import React, { useEffect, useRef } from 'react';
import { Copy, Forward, Trash2, Reply } from 'lucide-react';

export default function MessageContextMenu({
  isOpen,
  position,
  onClose,
  onCopy,
  onForward,
  onDelete,
  onReply,
  message,
  isMyMessage
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      icon: <Copy size={16} />,
      label: 'نسخ النص',
      action: onCopy,
      show: message.text && message.text.trim()
    },
    {
      icon: <Forward size={16} />,
      label: 'إعادة توجيه',
      action: onForward,
      show: true
    },
    {
      icon: <Reply size={16} />,
      label: 'رد',
      action: onReply,
      show: !isMyMessage
    },
    {
      icon: <Trash2 size={16} />,
      label: 'حذف',
      action: onDelete,
      show: isMyMessage,
      className: 'text-red-600 hover:bg-red-50'
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-36"
      style={{
        left: position.x,
        top: position.y,
        direction: 'rtl'
      }}
    >
      {menuItems.filter(item => item.show).map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors text-right ${
            item.className || 'text-gray-700'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}