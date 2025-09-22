import React from 'react';
import { Search } from 'lucide-react';
import MessageItem from './MessageItem';

export default function MessageList({ messages, chatId, socket, onReplyToMessage }) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-600 mt-20">
        <div className="bg-white/60 backdrop-blur-sm rounded-full p-6 w-32 h-32 mx-auto flex items-center justify-center mb-4 border border-gray-300 shadow-lg">
          <Search size={50} className="text-gray-500" />
        </div>
        <p className="text-lg font-medium text-gray-700">لا توجد رسائل</p>
        <p className="text-sm text-gray-500">ابدأ محادثة جديدة</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        backgroundColor: '#f3f2f1'
      }}
    >
      <div className="py-4 px-2">
        {messages.map((msg, i) => (
          <MessageItem key={msg.id || i} message={msg} chatId={chatId} socket={socket} onReplyToMessage={onReplyToMessage} />
        ))}
      </div>
    </div>
  );
}