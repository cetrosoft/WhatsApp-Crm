/**
 * Pipelines Management Page
 * Manage sales pipelines and stages
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pipelineAPI } from '../services/api';
import { Plus, Settings, Trash2, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import PipelineModal from '../components/Pipelines/PipelineModal';

const Pipelines = () => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();

  // State
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);

  // Permissions
  const canView = hasPermission(user, 'pipelines.view');
  const canCreate = hasPermission(user, 'pipelines.create');
  const canEdit = hasPermission(user, 'pipelines.edit');
  const canDelete = hasPermission(user, 'pipelines.delete');

  useEffect(() => {
    if (canView) {
      loadPipelines();
    }
  }, [canView]);

  /**
   * Load all pipelines
   */
  const loadPipelines = async () => {
    try {
      setLoading(true);
      const response = await pipelineAPI.getPipelines();
      setPipelines(response.data || []);
    } catch (error) {
      console.error('Error loading pipelines:', error);
      toast.error(t('failedToLoadPipelines'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle create pipeline
   */
  const handleCreate = () => {
    if (!canCreate) {
      toast.error(t('insufficientPermissions'));
      return;
    }
    setEditingPipeline(null);
    setShowModal(true);
  };

  /**
   * Handle edit pipeline
   */
  const handleEdit = (pipeline) => {
    if (!canEdit) {
      toast.error(t('insufficientPermissions'));
      return;
    }
    setEditingPipeline(pipeline);
    setShowModal(true);
  };

  /**
   * Handle delete pipeline
   */
  const handleDelete = async (pipeline) => {
    if (!canDelete) {
      toast.error(t('insufficientPermissions'));
      return;
    }

    if (!confirm(t('confirmDeletePipeline'))) {
      return;
    }

    try {
      await pipelineAPI.deletePipeline(pipeline.id);
      toast.success(t('pipelineDeleted'));
      loadPipelines();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      toast.error(t('failedToDeletePipeline'));
    }
  };

  /**
   * Handle modal save
   */
  const handleSave = () => {
    setShowModal(false);
    setEditingPipeline(null);
    loadPipelines();
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setShowModal(false);
    setEditingPipeline(null);
  };

  // Permission guard
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('insufficientPermissions')}</h2>
          <p className="text-gray-600">{t('contactAdmin')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pipelinesManagement')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {pipelines.length} {t('pipelines').toLowerCase()}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            {t('createPipeline')}
          </button>
        )}
      </div>

      {/* Pipelines Grid */}
      {pipelines.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noPipelines')}</h3>
          <p className="text-gray-600 mb-4">{t('createFirstPipeline')}</p>
          {canCreate && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              {t('createPipeline')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{pipeline.name}</h3>
                      {pipeline.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          <Check className="w-3 h-3 me-1" />
                          {t('defaultPipeline')}
                        </span>
                      )}
                    </div>
                    {pipeline.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{pipeline.description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1 ms-2">
                      {canEdit && (
                        <button
                          onClick={() => handleEdit(pipeline)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && !pipeline.is_default && (
                        <button
                          onClick={() => handleDelete(pipeline)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-600">{t('stages')}</p>
                    <p className="text-2xl font-bold text-gray-900">{pipeline.stage_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('activeDeals')}</p>
                    <p className="text-2xl font-bold text-gray-900">{pipeline.deal_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Stages Preview */}
              {pipeline.stages && pipeline.stages.length > 0 && (
                <div className="px-6 pb-6">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{t('stages')}</p>
                  <div className="flex flex-wrap gap-2">
                    {pipeline.stages.slice(0, 5).map((stage) => (
                      <span
                        key={stage.id}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${stage.color}-100 text-${stage.color}-800`}
                      >
                        {stage.name}
                      </span>
                    ))}
                    {pipeline.stages.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        +{pipeline.stages.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Modal */}
      {showModal && (
        <PipelineModal
          pipeline={editingPipeline}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default Pipelines;
