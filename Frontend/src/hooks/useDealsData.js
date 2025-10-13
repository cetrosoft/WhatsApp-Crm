// Frontend/src/hooks/useDealsData.js
import { useState, useEffect, useCallback } from 'react';
import { crmAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useDealsData = () => {
  const { t } = useTranslation();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load pipelines
  const loadPipelines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await crmAPI.get('/pipelines');
      const pipelineList = response.data?.data || [];
      setPipelines(pipelineList);

      // Auto-select first pipeline
      if (pipelineList.length > 0 && !selectedPipeline) {
        setSelectedPipeline(pipelineList[0]);
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
      toast.error(t('deals.errors.loadPipelines'));
    } finally {
      setLoading(false);
    }
  }, [selectedPipeline, t]);

  // Load deals for selected pipeline
  const loadDeals = useCallback(async () => {
    if (!selectedPipeline?.id) return;

    try {
      setLoading(true);
      const response = await crmAPI.get(`/deals?pipelineId=${selectedPipeline.id}`);
      const dealsData = response.data?.data || [];
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error(t('deals.errors.loadDeals'));
    } finally {
      setLoading(false);
    }
  }, [selectedPipeline?.id, t]);

  // Load stages for selected pipeline
  useEffect(() => {
    if (selectedPipeline?.stages) {
      setStages(selectedPipeline.stages);
    }
  }, [selectedPipeline]);

  // Initial load
  useEffect(() => {
    loadPipelines();
  }, []);

  // Load deals when pipeline changes
  useEffect(() => {
    loadDeals();
  }, [selectedPipeline?.id]);

  return {
    // State
    pipelines,
    selectedPipeline,
    deals,
    stages,
    loading,

    // Actions
    setSelectedPipeline,
    setDeals, // Expose for optimistic updates
    loadDeals, // Expose for refresh after CRUD
    loadPipelines,
  };
};
