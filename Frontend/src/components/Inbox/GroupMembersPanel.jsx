import React, { useState, useEffect } from 'react';
import { X, Users, Crown, Shield, User } from 'lucide-react';

export default function GroupMembersPanel({ groupId, groupName, onClose, onMentionUser }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupMembers();
    }
  }, [groupId]);

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/group-members/${groupId}`);
      const data = await response.json();

      if (response.ok) {
        setMembers(data.members || []);
        setError(null);
      } else {
        setError(data.error || 'فشل في جلب أعضاء المجموعة');
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleMentionClick = (member) => {
    if (onMentionUser) {
      const mentionText = `@${member.name || member.number} `;
      onMentionUser(mentionText);
    }
  };

  const getMemberIcon = (member) => {
    if (member.isSuperAdmin) return <Crown size={14} className="text-yellow-500" />;
    if (member.isAdmin) return <Shield size={14} className="text-orange-500" />;
    return <User size={14} className="text-gray-500" />;
  };

  const getMemberRole = (member) => {
    if (member.isSuperAdmin) return 'المنشئ';
    if (member.isAdmin) return 'مدير';
    return 'عضو';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-white w-80 h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#464775]">
          <div className="flex items-center gap-2 text-white">
            <Users size={20} />
            <div>
              <h3 className="font-semibold text-lg">أعضاء المجموعة</h3>
              <p className="text-sm opacity-90">{groupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#464775]"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={fetchGroupMembers}
                className="mt-2 px-4 py-2 bg-[#464775] text-white rounded-md hover:bg-[#3a3a5c] transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <div className="p-2">
              <div className="mb-3 px-2">
                <p className="text-sm text-gray-600">
                  {members.length} عضو
                </p>
              </div>

              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleMentionClick(member)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-[#464775] rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name ? member.name.charAt(0).toUpperCase() : '👤'}
                    </div>

                    {/* Member info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {member.name || `+${member.number}`}
                        </p>
                        {getMemberIcon(member)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {member.name && <span>+{member.number}</span>}
                        {member.name && <span>•</span>}
                        <span>{getMemberRole(member)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}