import React from 'react';
import { Search } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search size={40} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">اختر محادثة</h3>
        <p className="text-sm text-gray-400">
          اختر محادثة من القائمة لعرض الرسائل والرد عليها
        </p>
      </div>
    </div>
  );
}