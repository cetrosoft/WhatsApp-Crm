/**
 * IconSelector Component
 * Dropdown selector for Lucide icons with preview
 *
 * Features:
 * - Searchable icon grid
 * - Visual preview of each icon
 * - Selected icon display
 * - 150+ available icons
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { AVAILABLE_ICONS, getIconComponent, formatIconName, searchIcons } from '../../utils/iconList';

const IconSelector = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const filteredIcons = searchIcons(search);
  const SelectedIcon = selected ? getIconComponent(selected) : null;

  const handleIconSelect = (iconName) => {
    onChange(iconName);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white"
      >
        <div className="flex items-center space-x-2">
          {SelectedIcon ? (
            <>
              <SelectedIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">{formatIconName(selected)}</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Select icon...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Icon Grid */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
                {filteredIcons.map((iconName) => {
                  const IconComponent = getIconComponent(iconName);
                  const isSelected = selected === iconName;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleIconSelect(iconName)}
                      className={`p-3 rounded-lg hover:bg-gray-100 flex flex-col items-center justify-center transition-colors ${
                        isSelected ? 'bg-red-50 border-2 border-red-500' : 'border-2 border-transparent'
                      }`}
                      title={formatIconName(iconName)}
                    >
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'text-red-600' : 'text-gray-600'}`} />
                      <span className={`text-[9px] mt-1 text-center truncate w-full ${
                        isSelected ? 'text-red-600 font-medium' : 'text-gray-500'
                      }`}>
                        {formatIconName(iconName)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No icons found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconSelector;
