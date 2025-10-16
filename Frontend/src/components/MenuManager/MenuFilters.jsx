/**
 * MenuFilters Component
 * Search and filter controls for menu management
 *
 * Features:
 * - Search by menu name
 * - Filter by status (active/inactive)
 * - Filter by system/custom
 * - Clear all filters
 */

import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';

const MenuFilters = ({ onSearch, onFilter }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [systemFilter, setSystemFilter] = useState('all');

  const handleSearchChange = (value) => {
    setSearch(value);
    onSearch(value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    onFilter({ status: value, system: systemFilter });
  };

  const handleSystemChange = (value) => {
    setSystemFilter(value);
    onFilter({ status: statusFilter, system: value });
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSystemFilter('all');
    onSearch('');
    onFilter({ status: 'all', system: 'all' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search menus..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Filter className="w-5 h-5 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* System/Custom Filter */}
        <select
          value={systemFilter}
          onChange={(e) => handleSystemChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="all">All Menus</option>
          <option value="system">System Only</option>
          <option value="custom">Custom Only</option>
        </select>

        {/* Clear Filters Button */}
        <button
          onClick={clearFilters}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default MenuFilters;
