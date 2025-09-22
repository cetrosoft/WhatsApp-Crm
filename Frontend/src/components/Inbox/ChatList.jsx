import React from 'react';
import ChatListItem from './ChatListItem';

export default function ChatList({
  filteredChats,
  activeChat,
  openChat,
  isConnected
}) {
  if (filteredChats.length === 0) {
    return (
      <p className="p-4 text-gray-500 text-center">
        {isConnected ? "لا توجد محادثات" : "انتظار الاتصال..."}
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={activeChat?.id === chat.id}
          onClick={() => openChat(chat)}
        />
      ))}
    </div>
  );
}