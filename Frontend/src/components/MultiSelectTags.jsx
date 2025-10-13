/**
 * Multi-Select Tags Component
 * Dropdown with checkboxes for selecting multiple tags
 * Works with tag objects: { id, name_en, name_ar, color }
 *
 * @reusable
 * @category Shared/Universal
 * @example
 * <MultiSelectTags
 *   selectedTags={selectedTags}
 *   onChange={setSelectedTags}
 *   options={allTags}
 *   placeholder="Select tags"
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MultiSelectTags = ({
  selectedTags = [], // Array of tag IDs
  onChange,
  options = [], // Array of tag objects
  placeholder = 'Select tags...',
  className = ''
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = searchQuery
    ? options.filter(option => {
        const name = isRTL && option.name_ar ? option.name_ar : option.name_en;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  const handleToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId, e) => {
    e.stopPropagation();
    onChange(selectedTags.filter(id => id !== tagId));
  };

  // Get selected tag objects for display
  const selectedTagObjects = options.filter(tag => selectedTags.includes(tag.id));

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm text-start border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {selectedTags.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedTagObjects.slice(0, 2).map((tag) => {
                  const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color || '#6366f1' }}
                    >
                      {tagName}
                      <X
                        className="w-3 h-3 cursor-pointer hover:opacity-80"
                        onClick={(e) => handleRemoveTag(tag.id, e)}
                      />
                    </span>
                  );
                })}
                {selectedTags.length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    +{selectedTags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No tags found
              </div>
            ) : (
              <>
                {/* Clear All Option */}
                {selectedTags.length > 0 && (
                  <div
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer border-b border-gray-200"
                    onClick={handleClearAll}
                  >
                    Clear all ({selectedTags.length})
                  </div>
                )}

                {filteredOptions.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(tag.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color || '#6366f1' }}
                      >
                        {tagName}
                      </span>
                    </label>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectTags;
