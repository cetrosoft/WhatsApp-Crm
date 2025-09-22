import React, { useState } from 'react';
import { Users } from 'lucide-react';
import GroupMembersPanel from './GroupMembersPanel';

export default function ChatHeader({ activeChat, onMentionUser }) {
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  const handleMembersClick = () => {
    if (activeChat.isGroup) {
      setShowMembersPanel(true);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-[#e1dfdd] bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6264a7] rounded-full flex items-center justify-center text-white font-semibold">
              {activeChat.isGroup ? '👥' : '👤'}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">
                {activeChat.name || activeChat.number}
              </h2>
              {activeChat.isGroup && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#6264a7]">مجموعة واتساب</p>
                  <button
                    onClick={handleMembersClick}
                    className="flex items-center gap-1 text-xs text-[#6264a7] hover:text-[#464775] hover:bg-[#f0f0f8] px-2 py-1 rounded-full transition-colors"
                  >
                    <Users size={12} />
                    <span>عرض الأعضاء</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#6264a7] font-medium">
              {activeChat.messages?.length || 0} رسالة
            </span>
          </div>
        </div>
      </div>

      {/* Group Members Panel */}
      {showMembersPanel && activeChat.isGroup && (
        <GroupMembersPanel
          groupId={activeChat.id}
          groupName={activeChat.name}
          onClose={() => setShowMembersPanel(false)}
          onMentionUser={onMentionUser}
        />
      )}
    </>
  );
}