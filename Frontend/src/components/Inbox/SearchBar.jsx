import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ search, setSearch }) {
  return (
    <div className="p-2 border-b flex items-center gap-2 bg-gray-50">
      <Search size={18} className="text-gray-500" />
      <input
        type="text"
        placeholder="بحث بالاسم أو الرقم..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 outline-none bg-transparent"
      />
    </div>
  );
}