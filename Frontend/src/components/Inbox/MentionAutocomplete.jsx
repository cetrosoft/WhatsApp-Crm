import React, { useState, useEffect, useRef } from 'react';
import { Crown, Shield, User } from 'lucide-react';

export default function MentionAutocomplete({
  isVisible,
  searchQuery,
  members,
  onSelectMember,
  position
}) {
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (members && members.length > 0) {
      if (searchQuery) {
        // Filter members based on search query
        const filtered = members.filter(member => {
          const name = member.name || '';
          const number = member.number || '';
          const query = searchQuery.toLowerCase();

          return name.toLowerCase().includes(query) ||
                 number.includes(searchQuery);
        });

        setFilteredMembers(filtered);
      } else {
        // Show all members when @ is typed without search query
        setFilteredMembers(members);
      }
      setSelectedIndex(0);
    } else {
      setFilteredMembers([]);
    }
  }, [searchQuery, members]);

  useEffect(() => {
    if (listRef.current && filteredMembers.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (!isVisible || filteredMembers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredMembers[selectedIndex]) {
          onSelectMember(filteredMembers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onSelectMember(null);
        break;
    }
  };

  // Attach keyboard event listener to document
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVisible, filteredMembers, selectedIndex]);

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

  if (!isVisible || filteredMembers.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50"
      style={{
        bottom: position?.bottom || '100%',
        left: position?.left || 0,
        minWidth: '280px',
        maxWidth: '320px'
      }}
    >
      <div className="p-2 border-b border-gray-100">
        <p className="text-xs text-gray-500">
          اختر عضو للإشارة إليه ({filteredMembers.length} نتيجة)
        </p>
      </div>

      <ul ref={listRef} className="max-h-40 overflow-y-auto">
        {filteredMembers.map((member, index) => (
          <li
            key={member.id}
            className={`p-2 cursor-pointer transition-colors ${
              index === selectedIndex
                ? 'bg-[#f0f0f8] border-l-2 border-[#464775]'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectMember(member)}
          >
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <div className="w-8 h-8 bg-[#464775] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {member.name ? member.name.charAt(0).toUpperCase() : '👤'}
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {member.name || `+${member.number}`}
                  </p>
                  {getMemberIcon(member)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {member.name && <span>+{member.number}</span>}
                  {member.name && <span>•</span>}
                  <span>{getMemberRole(member)}</span>
                </div>
              </div>

              {/* Keyboard hint */}
              {index === selectedIndex && (
                <div className="text-xs text-[#464775] bg-[#f0f0f8] px-1 py-0.5 rounded">
                  ↵
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="p-2 border-t border-gray-100 text-xs text-gray-400">
        استخدم ↑↓ للتنقل، Enter للاختيار، Esc للإلغاء
      </div>
    </div>
  );
}