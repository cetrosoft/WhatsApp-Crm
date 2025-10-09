/**
 * Pipeline Modal Component
 * Create/Edit pipeline with stage management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pipelineAPI } from '../../services/api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import StageBuilder from './StageBuilder';

const PipelineModal = ({ pipeline, onSave, onClose }) => {
  const { t } = useTranslation(['common']);
  const isEdit = !!pipeline;

  // Form state
  const [formData, setFormData] = useState({
    name: pipeline?.name || '',
    description: pipeline?.description || '',
    is_default: pipeline?.is_default || false,
  });

  // Sort stages by display_order when loading
  const initialStages = pipeline?.stages
    ? [...pipeline.stages].sort((a, b) => a.display_order - b.display_order)
    : [{ name: 'Lead', color: 'blue', display_order: 0, temp_id: Date.now() }];

  const [stages, setStages] = useState(initialStages);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('pipelineNameRequired');
    }

    if (stages.length === 0) {
      newErrors.stages = t('atLeastOneStage');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Handle save
   */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const pipelineData = {
        ...formData,
        stages: stages.map((stage, index) => ({
          id: stage.id, // Will be undefined for new stages
          name: stage.name,
          color: stage.color,
          display_order: index, // Use array index as display_order
        })),
      };

      console.log('💾 [DEBUG] Saving pipeline with stages:', pipelineData.stages);

      if (isEdit) {
        const response = await pipelineAPI.updatePipeline(pipeline.id, pipelineData);
        console.log('✅ [DEBUG] Updated pipeline response:', response);
        toast.success(t('pipelineUpdated'));
      } else {
        const response = await pipelineAPI.createPipeline(pipelineData);
        console.log('✅ [DEBUG] Created pipeline response:', response);
        toast.success(t('pipelineCreated'));
      }

      onSave();
    } catch (error) {
      console.error('❌ [DEBUG] Error saving pipeline:', error);
      const errorMessage = isEdit ? t('failedToUpdatePipeline') : t('failedToCreatePipeline');
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? t('editPipeline') : t('createPipeline')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Pipeline Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pipelineName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('pipelineName')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pipelineDescription')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('pipelineDescription')}
                />
              </div>

              {/* Is Default */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_default" className="ms-2 text-sm font-medium text-gray-700">
                  {t('isDefault')}
                </label>
              </div>

              {/* Stages Builder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('stages')} <span className="text-red-500">*</span>
                </label>
                <StageBuilder
                  stages={stages}
                  onChange={setStages}
                />
                {errors.stages && (
                  <p className="mt-1 text-sm text-red-600">{errors.stages}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                disabled={saving}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PipelineModal;
