/**
 * Deal Modal Component
 * Create/Edit deal with comprehensive form
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dealAPI, contactAPI, companyAPI, userAPI, tagAPI } from '../../services/api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissionUtils';
import DealFormFields from './DealFormFields';

const DealModal = ({ deal, pipeline, stages, onSave, onClose }) => {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const isEdit = !!deal;

  // Form state
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    value: deal?.value || '',
    currency: deal?.currency || 'SAR',
    pipeline_id: deal?.pipeline_id || pipeline?.id || '',
    stage_id: deal?.stage_id || '',
    contact_id: deal?.contact_id || '',
    company_id: deal?.company_id || '',
    expected_close_date: deal?.expected_close_date || '',
    probability: deal?.probability || 50,
    assigned_to: deal?.assigned_to || '',
    notes: deal?.notes || '',
    tags: deal?.tags || [], // Array of tag IDs
  });

  // If deal has tag_details, add them to tags state immediately
  useEffect(() => {
    if (deal?.tag_details && deal.tag_details.length > 0) {
      setTags(prevTags => {
        // Merge existing tags with deal's tag_details
        const existingIds = prevTags.map(t => t.id);
        const newTags = deal.tag_details.filter(t => !existingIds.includes(t.id));
        return [...prevTags, ...newTags];
      });
    }
  }, [deal]);

  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Dropdown data
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]); // Available tags from database
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  /**
   * Load dropdown data
   */
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [contactsRes, companiesRes, usersRes, tagsRes] = await Promise.all([
          contactAPI.getContacts({ limit: 1000 }),
          companyAPI.getCompanies({ limit: 1000 }),
          userAPI.getUsers(),
          tagAPI.getTags(),
        ]);

        setContacts(contactsRes.data || []);
        setCompanies(companiesRes.data || []);
        setUsers(usersRes.data || []);
        setTags(tagsRes.data || []);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        toast.error(t('failedToLoadData'));
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, [t]);

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('required');
    }

    if (!formData.value || formData.value <= 0) {
      newErrors.value = t('required');
    }

    if (!formData.pipeline_id) {
      newErrors.pipeline_id = t('required');
    }

    if (!formData.stage_id) {
      newErrors.stage_id = t('required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Handle tag input
   */
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(e);
    }
  };

  /**
   * Add tag (auto-create if doesn't exist)
   */
  const addTag = async (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;

    const newTagName = tagInput.trim();

    // Check if tag already exists in available tags
    let existingTag = tags.find(tag =>
      tag.name_en.toLowerCase() === newTagName.toLowerCase() ||
      (tag.name_ar && tag.name_ar.toLowerCase() === newTagName.toLowerCase())
    );

    // Check if already selected
    if (existingTag && formData.tags.includes(existingTag.id)) {
      toast.error(t('tagAlreadyExists'));
      return;
    }

    let tagId;

    if (existingTag) {
      // Use existing tag
      tagId = existingTag.id;
    } else {
      // Check permission before attempting to create new tag
      if (!hasPermission(user, 'tags.create')) {
        toast.error(t('permissionDenied'), { duration: 5000 });
        return;
      }

      // Auto-create new tag
      try {
        const response = await tagAPI.createTag({
          name_en: newTagName,
          name_ar: newTagName, // Same for both initially
          color: '#6366f1' // Default color
        });

        if (response.success) {
          const newTag = response.tag;
          setTags(prev => [...prev, newTag]);
          tagId = newTag.id;
          toast.success(t('newTagCreated'));
        }
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error(t('cannotCreateTags'), { duration: 5000 });
          return;
        }

        if (error.message.includes('already exists')) {
          // Tag was just created by another user, reload tags
          const tagsRes = await tagAPI.getTags();
          setTags(tagsRes.data || []);
          const reloadedTag = tagsRes.data?.find(t => t.name_en.toLowerCase() === newTagName.toLowerCase());
          if (reloadedTag) tagId = reloadedTag.id;
        } else {
          toast.error(t('failedToCreate', { resource: t('tag') }));
          return;
        }
      }
    }

    if (tagId) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagId]
      }));
      setTagInput('');
    }
  };

  /**
   * Remove tag
   */
  const removeTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
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

      const dealData = {
        ...formData,
        value: parseFloat(formData.value),
        probability: parseInt(formData.probability),
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        assigned_to: formData.assigned_to || null,
        expected_close_date: formData.expected_close_date || null,
      };

      if (isEdit) {
        await dealAPI.updateDeal(deal.id, dealData);
        toast.success(t('dealUpdated'));
      } else {
        await dealAPI.createDeal(dealData);
        toast.success(t('dealCreated'));
      }

      onSave();
    } catch (error) {
      console.error('Error saving deal:', error);
      const errorMessage = isEdit ? t('failedToUpdate', { resource: t('deal') }) : t('failedToCreate', { resource: t('deal') });
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? t('editDeal') : t('createDeal')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <DealFormFields
                formData={formData}
                handleChange={handleChange}
                errors={errors}
                pipeline={pipeline}
                stages={stages}
                contacts={contacts}
                companies={companies}
                users={users}
                tags={tags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                handleTagKeyDown={handleTagKeyDown}
                addTag={addTag}
                removeTag={removeTag}
                loadingDropdowns={loadingDropdowns}
              />
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
                disabled={saving || loadingDropdowns}
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

export default DealModal;
