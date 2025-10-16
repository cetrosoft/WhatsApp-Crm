/**
 * Contact Modal
 * Add/Edit contact form with avatar upload
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { contactAPI, countryAPI, statusAPI, userAPI, tagAPI, leadSourceAPI, companyAPI } from '../services/api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import ContactFormFields from './Contacts/ContactFormFields';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';

const ContactModal = ({ isOpen, onClose, contact, onSave }) => {
  const { t, i18n } = useTranslation(['contacts', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    phone_country_code: '+966',
    email: '',
    position: '',
    status_id: '',
    country_id: '',
    company_id: '',
    lead_source: '',
    address: '',
    city: '',
    notes: '',
    assigned_to: '',
    tag_ids: [], // Changed from tags to tag_ids
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Lookup data
  const [countries, setCountries] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]); // All available tags
  const [leadSources, setLeadSources] = useState([]); // All available lead sources
  const [companies, setCompanies] = useState([]); // All available companies

  // Load lookup data
  useEffect(() => {
    if (isOpen) {
      loadLookupData();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        phone: contact.phone || '',
        phone_country_code: contact.phone_country_code || '+966',
        email: contact.email || '',
        position: contact.position || '',
        status_id: contact.status_id || '',
        country_id: contact.country_id || '',
        company_id: contact.company_id || '',
        lead_source: contact.lead_source || '',
        address: contact.address || '',
        city: contact.city || '',
        notes: contact.notes || '',
        assigned_to: contact.assigned_to || '',
        tag_ids: contact.contact_tags ? contact.contact_tags.map(ct => ct.tag_id) : [],
      });
      setAvatarPreview(contact.avatar_url || null);
    } else {
      // Reset form for new contact
      setFormData({
        name: '',
        phone: '',
        phone_country_code: '+966',
        email: '',
        position: '',
        status_id: '',
        country_id: '',
        company_id: '',
        lead_source: '',
        address: '',
        city: '',
        notes: '',
        assigned_to: '',
        tag_ids: [],
      });
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [contact]);

  /**
   * Load countries, statuses, users, tags, and lead sources
   */
  const loadLookupData = async () => {
    try {
      const [countriesRes, statusesRes, usersRes, tagsRes, leadSourcesRes, companiesRes] = await Promise.all([
        countryAPI.getCountries(),
        statusAPI.getContactStatuses(),
        userAPI.getUsers(),
        tagAPI.getTags(),
        leadSourceAPI.getLeadSources(),
        companyAPI.getCompanies(),
      ]);

      setCountries(countriesRes.data || []);
      setStatuses(statusesRes.data || []);
      setUsers(usersRes.data || []);
      setTags(tagsRes.data || []);
      setLeadSources(leadSourcesRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      console.error('Error loading lookup data:', error);
      toast.error(t('failedToLoadFormData', { ns: 'common' }));
    }
  };

  /**
   * Handle form field changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handle avatar file selection
   */
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('invalidFileTypeMessage', { ns: 'common', types: 'JPG, PNG, WEBP' }));
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('fileTooLargeMessage', { ns: 'common', size: '2MB' }));
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remove avatar
   */
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Add tag (auto-create if doesn't exist)
   */
  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;

    const newTagName = tagInput.trim();

    // Check if tag already exists in available tags
    let existingTag = tags.find(tag =>
      tag.name_en.toLowerCase() === newTagName.toLowerCase() ||
      (tag.name_ar && tag.name_ar.toLowerCase() === newTagName.toLowerCase())
    );

    // Check if already selected
    if (existingTag && formData.tag_ids.includes(existingTag.id)) {
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
        toast.error(t('common:permissionDenied'), { duration: 5000 });
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
          toast.success(t('newTagCreated', { ns: 'common' }));
        }
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error(t('cannotCreateTags', { ns: 'common' }), {
            duration: 5000
          });
          return;
        }

        if (error.message.includes('already exists')) {
          // Tag was just created by another user, reload tags
          await loadLookupData();
          const reloadedTag = tags.find(t => t.name_en.toLowerCase() === newTagName.toLowerCase());
          if (reloadedTag) tagId = reloadedTag.id;
        } else {
          toast.error(t('failedToCreate', { ns: 'common', resource: t('tag', { ns: 'common' }) }));
          return;
        }
      }
    }

    if (tagId) {
      setFormData((prev) => ({
        ...prev,
        tag_ids: [...prev.tag_ids, tagId],
      }));
      setTagInput('');
    }
  };

  /**
   * Remove tag
   */
  const handleRemoveTag = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.filter((id) => id !== tagId),
    }));
  };

  /**
   * Handle tag input key press
   */
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTag(e);
    }
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      // Clean formData: convert empty strings to null for UUID and optional fields
      const cleanedData = {
        ...formData,
        status_id: formData.status_id || null,
        country_id: formData.country_id || null,
        company_id: formData.company_id || null,
        assigned_to: formData.assigned_to || null,
        lead_source: formData.lead_source || null,
        email: formData.email || null,
        position: formData.position || null,
        address: formData.address || null,
        city: formData.city || null,
        notes: formData.notes || null,
      };

      if (contact) {
        // Update existing contact
        response = await contactAPI.updateContact(contact.id, cleanedData);
      } else {
        // Create new contact
        response = await contactAPI.createContact(cleanedData);
      }

      if (response.success) {
        const contactId = contact?.id || response.data?.id;

        // Upload avatar if selected
        if (avatarFile && contactId) {
          try {
            setUploadingAvatar(true);
            await contactAPI.uploadAvatar(contactId, avatarFile);
          } catch (uploadError) {
            console.error('Avatar upload error:', uploadError);
            toast.error(t('savedButUploadFailed', { ns: 'common', resource: t('contact', { ns: 'common' }), item: t('avatar', { ns: 'common' }) }));
          } finally {
            setUploadingAvatar(false);
          }
        }

        toast.success(contact ? t('contactUpdated') : t('contactCreated'));
        onSave();
      }
    } catch (error) {
      console.error('Error saving contact:', error);

      // Check if upgrade is required
      if (error.response?.data?.upgrade_required) {
        toast.error(error.response.data.message, {
          duration: 6000,
          action: {
            label: 'Upgrade Plan',
            onClick: () => {
              onClose();
              navigate('/account-settings?tab=subscription');
            }
          }
        });
      } else if (error.response?.data?.error === 'INSUFFICIENT_PERMISSIONS') {
        toast.error(t('insufficientPermissions', { ns: 'common' }), { duration: 5000 });
      } else {
        toast.error(error.response?.data?.message || error.message || t('failedToSave', { ns: 'common', resource: t('contact', { ns: 'common' }) }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-start overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {contact ? t('editContact') : t('addContact')}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <ContactFormFields
              formData={formData}
              handleChange={handleChange}
              avatarPreview={avatarPreview}
              fileInputRef={fileInputRef}
              handleAvatarSelect={handleAvatarSelect}
              handleRemoveAvatar={handleRemoveAvatar}
              tagInput={tagInput}
              setTagInput={setTagInput}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
              handleTagKeyPress={handleTagKeyPress}
              countries={countries}
              statuses={statuses}
              users={users}
              tags={tags}
              leadSources={leadSources}
              companies={companies}
            />

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || uploadingAvatar}
                className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading || uploadingAvatar ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
