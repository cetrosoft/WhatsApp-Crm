/**
 * Stage Builder Component
 * Add, edit, delete, and reorder stages
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';

const STAGE_COLORS = [
  { value: 'blue', label: 'colorBlue', class: 'bg-blue-100 text-blue-800' },
  { value: 'purple', label: 'colorPurple', class: 'bg-purple-100 text-purple-800' },
  { value: 'yellow', label: 'colorYellow', class: 'bg-yellow-100 text-yellow-800' },
  { value: 'orange', label: 'colorOrange', class: 'bg-orange-100 text-orange-800' },
  { value: 'green', label: 'colorGreen', class: 'bg-green-100 text-green-800' },
  { value: 'red', label: 'colorRed', class: 'bg-red-100 text-red-800' },
  { value: 'indigo', label: 'colorIndigo', class: 'bg-indigo-100 text-indigo-800' },
  { value: 'pink', label: 'colorPink', class: 'bg-pink-100 text-pink-800' },
];

const StageBuilder = ({ stages, onChange }) => {
  const { t } = useTranslation(['common']);

  const [editingIndex, setEditingIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  /**
   * Add new stage
   */
  const handleAdd = () => {
    const newStage = {
      name: '',
      color: 'blue',
      display_order: stages.length,
      temp_id: Date.now(), // Temporary ID for React keys
    };
    onChange([...stages, newStage]);
    setEditingIndex(stages.length);
  };

  /**
   * Update stage
   */
  const handleUpdate = (index, field, value) => {
    const updatedStages = [...stages];
    updatedStages[index] = {
      ...updatedStages[index],
      [field]: value,
    };
    onChange(updatedStages);
  };

  /**
   * Delete stage
   */
  const handleDelete = (index) => {
    if (stages.length === 1) {
      alert(t('atLeastOneStage'));
      return;
    }

    if (confirm(t('confirmDeleteStage'))) {
      const updatedStages = stages.filter((_, i) => i !== index);
      onChange(updatedStages);
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    }
  };

  /**
   * Start editing
   */
  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  /**
   * Finish editing
   */
  const handleFinishEdit = () => {
    setEditingIndex(null);
  };

  /**
   * Drag handlers
   */
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStages = [...stages];
    const draggedStage = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, draggedStage);

    onChange(newStages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  /**
   * Get color class
   */
  const getColorClass = (color) => {
    const colorObj = STAGE_COLORS.find(c => c.value === color);
    return colorObj ? colorObj.class : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-3">
      {/* Hint */}
      {stages.length > 1 && (
        <p className="text-xs text-gray-500">{t('reorderStages')}</p>
      )}

      {/* Stages List */}
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div
            key={stage.id || stage.temp_id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg transition ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            {/* Drag Handle */}
            <div className="cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Stage Content */}
            <div className="flex-1 flex items-center gap-3">
              {editingIndex === index ? (
                <>
                  {/* Edit Mode */}
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={t('stageName')}
                    autoFocus
                  />

                  {/* Color Picker */}
                  <select
                    value={stage.color}
                    onChange={(e) => handleUpdate(index, 'color', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {STAGE_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {t(color.label)}
                      </option>
                    ))}
                  </select>

                  {/* Finish Edit Button */}
                  <button
                    type="button"
                    onClick={handleFinishEdit}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                    title={t('save')}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <span className="text-sm font-medium text-gray-700 flex-1">{stage.name || t('stageName')}</span>

                  {/* Color Badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getColorClass(stage.color)}`}>
                    {t(`color${stage.color.charAt(0).toUpperCase()}${stage.color.slice(1)}`)}
                  </span>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleEdit(index)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition"
                    title={t('edit')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => handleDelete(index)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
              title={t('delete')}
              disabled={stages.length === 1}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Stage Button */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
      >
        <Plus className="w-4 h-4" />
        {t('addStage')}
      </button>
    </div>
  );
};

export default StageBuilder;
