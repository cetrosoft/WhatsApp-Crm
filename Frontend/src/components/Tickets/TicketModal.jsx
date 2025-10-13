/**
 * Ticket Modal Component
 * Create/Edit ticket with comprehensive form
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissionUtils';
import TicketFormFields from './TicketFormFields';
import { ticketAPI, userAPI, contactAPI, companyAPI, dealAPI, tagAPI } from '../../services/api';

const TicketModal = ({ ticket, onSave, onClose }) => {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const isEdit = !!ticket;

  // Form state
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    status: ticket?.status || 'open',
    priority: ticket?.priority || 'medium',
    category_id: ticket?.category_id || '',
    assigned_to: ticket?.assigned_to || '',
    contact_id: ticket?.contact_id || '',
    company_id: ticket?.company_id || '',
    deal_id: ticket?.deal_id || '',
    due_date: ticket?.due_date || '',
    tags: ticket?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  /**
   * Load dropdown data
   */
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);

        const [categoriesRes, contactsRes, companiesRes, dealsRes, usersRes, tagsRes] = await Promise.all([
          ticketAPI.getCategories(),
          contactAPI.getContacts({ limit: 1000 }),
          companyAPI.getCompanies({ limit: 1000 }),
          dealAPI.getDeals({ limit: 1000 }),
          userAPI.getUsers(),
          tagAPI.getTags(),
        ]);

        setCategories(categoriesRes.categories || []);
        setContacts(contactsRes.data || []);
        setCompanies(companiesRes.data || []);
        setDeals(dealsRes.data || []);
        setUsers(usersRes.users || []);
        setTags(tagsRes.tags || []);

        // If editing, load ticket tags
        if (ticket?.tag_details && ticket.tag_details.length > 0) {
          setTags(prevTags => {
            const existingIds = prevTags.map(t => t.id);
            const newTags = ticket.tag_details.filter(t => !existingIds.includes(t.id));
            return [...prevTags, ...newTags];
          });
        }
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        toast.error(t('failedToLoadData'));
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, [t, ticket]);

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('required');
    }

    if (!formData.status) {
      newErrors.status = t('required');
    }

    if (!formData.priority) {
      newErrors.priority = t('required');
    }

    if (!formData.category_id) {
      newErrors.category_id = t('required');
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

    // Check if tag already exists
    let existingTag = tags.find(tag =>
      tag.name_en.toLowerCase() === newTagName.toLowerCase() ||
      (tag.name_ar && tag.name_ar.toLowerCase() === newTagName.toLowerCase())
    );

    // Check if already selected
    if (existingTag && formData.tags.includes(existingTag.id)) {
      toast.error('Tag already selected');
      return;
    }

    let tagId;

    if (existingTag) {
      // Use existing tag
      tagId = existingTag.id;
    } else {
      // Check permission before creating new tag
      if (!hasPermission(user, 'tags.create')) {
        toast.error(t('permissionDenied'), { duration: 5000 });
        return;
      }

      // Auto-create new tag
      try {
        const response = await tagAPI.createTag({
          name_en: newTagName,
          name_ar: newTagName,
          color: '#6366f1'
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
        toast.error(t('failedToCreate', { resource: t('tag') }));
        return;
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

      const ticketData = {
        ...formData,
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        deal_id: formData.deal_id || null,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
      };

      if (isEdit) {
        await ticketAPI.updateTicket(ticket.id, ticketData);
        toast.success(t('ticketUpdated'));
      } else {
        await ticketAPI.createTicket(ticketData);
        toast.success(t('ticketCreated'));
      }

      onSave();
    } catch (error) {
      console.error('Error saving ticket:', error);
      const errorMessage = isEdit ? t('failedToUpdate', { resource: t('ticket') }) : t('failedToCreate', { resource: t('ticket') });
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
              {isEdit ? t('editTicket') : t('createTicket')}
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
              <TicketFormFields
                formData={formData}
                handleChange={handleChange}
                errors={errors}
                categories={categories}
                contacts={contacts}
                companies={companies}
                deals={deals}
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

export default TicketModal;
