import React from 'react';

export default function ChatListItem({ chat, isActive, onClick }) {
  return (
    <div
      className={`p-3 cursor-pointer hover:bg-[#f8f8f8] flex items-center gap-3 border-b border-[#e1dfdd] min-h-[70px] transition-colors ${
        isActive ? "bg-[#e6e7f7] border-l-4 border-l-[#6264a7]" : ""
      }`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
          chat.isGroup ? 'bg-[#6264a7]' : 'bg-[#6264a7]'
        }`}>
          {chat.isGroup ? '👥' : (chat.name ? chat.name.charAt(0).toUpperCase() : '👤')}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3
              className="font-semibold truncate text-sm"
              style={{
                direction: 'rtl',
                unicodeBidi: 'plaintext',
                textAlign: 'right'
              }}
            >
              {chat.name || chat.number}
            </h3>
            {chat.isGroup && (
              <span className="bg-[#e6e7f7] text-[#6264a7] px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                مجموعة
              </span>
            )}
          </div>
          {chat.unread > 0 && (
            <span className="bg-[#6264a7] text-white px-2 py-1 rounded-full text-xs min-w-[20px] text-center flex-shrink-0 ml-2">
              {chat.unread}
            </span>
          )}
        </div>
        <p
          className="text-sm text-gray-500 leading-tight"
          style={{
            direction: 'rtl',
            unicodeBidi: 'plaintext',
            textAlign: 'right',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}
        >
          {chat.lastMessage || 'لا توجد رسائل'}
        </p>
      </div>
    </div>
  );
}