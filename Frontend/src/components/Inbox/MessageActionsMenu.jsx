import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Reply, Forward, Copy } from 'lucide-react';

export default function MessageActionsMenu({
  message,
  isMyMessage,
  isParentHovered,
  onEdit,
  onDelete,
  onReply,
  onForward,
  onCopy
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (action, actionFn) => {
    setIsOpen(false);
    if (actionFn) {
      actionFn();
    }
  };

  // Check if message can be edited (within 15 minutes and is my message)
  const canEdit = () => {
    if (!isMyMessage || !message.timestamp) return false;
    const timeLimit = 15 * 60 * 1000; // 15 minutes
    return (Date.now() - message.timestamp) <= timeLimit;
  };

  return (
    <div
      className="absolute z-50"
      ref={menuRef}
      style={{
        top: '8px',
        right: isMyMessage ? '-40px' : 'auto',
        left: isMyMessage ? 'auto' : '-40px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Three dots button */}
      <button
        onClick={toggleMenu}
        className={`p-2 rounded-full hover:bg-gray-200 transition-all duration-200 ${
          isParentHovered || isHovered || isOpen ? 'opacity-100 bg-white shadow-md' : 'opacity-0'
        }`}
      >
        <MoreVertical size={14} className="text-gray-600" />
      </button>

      {/* Horizontal action menu */}
      {isOpen && (
        <div
          className="absolute z-[100] mt-1 p-1 bg-white border border-gray-200 rounded-lg shadow-xl flex items-center gap-1"
          style={{
            top: '40px',
            right: isMyMessage ? 'auto' : 'auto',
            left: isMyMessage ? '0px' : '0px',
            transform: 'translateX(0)'
          }}
        >
          {/* Copy */}
          {message.text && (
            <button
              onClick={() => handleAction('copy', onCopy)}
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-colors"
              title="نسخ"
            >
              <Copy size={16} />
            </button>
          )}

          {/* Reply */}
          <button
            onClick={() => handleAction('reply', onReply)}
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-colors"
            title="رد"
          >
            <Reply size={16} />
          </button>

          {/* Forward */}
          <button
            onClick={() => handleAction('forward', onForward)}
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-colors"
            title="إعادة توجيه"
          >
            <Forward size={16} />
          </button>

          {/* Edit (only for my messages with text) */}
          {isMyMessage && message.text && (
            <button
              onClick={() => handleAction('edit', onEdit)}
              disabled={!canEdit()}
              className={`p-2 rounded-md transition-colors ${
                canEdit()
                  ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="تعديل"
            >
              <Edit3 size={16} />
            </button>
          )}

          {/* Delete (only for my messages) */}
          {isMyMessage && (
            <button
              onClick={() => handleAction('delete', onDelete)}
              className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
              title="حذف"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}