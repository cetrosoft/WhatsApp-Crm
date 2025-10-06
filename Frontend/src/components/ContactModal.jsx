/**
 * Contact Modal
 * Add/Edit contact form with avatar upload
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { contactAPI, countryAPI, statusAPI, userAPI, tagAPI, leadSourceAPI } from '../services/api';
import { X, Upload, User, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from './SearchableSelect';

const ContactModal = ({ isOpen, onClose, contact, onSave }) => {
  const { t, i18n } = useTranslation('contacts');
  const isRTL = i18n.language === 'ar';
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
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
      const [countriesRes, statusesRes, usersRes, tagsRes, leadSourcesRes] = await Promise.all([
        countryAPI.getCountries(),
        statusAPI.getContactStatuses(),
        userAPI.getUsers(),
        tagAPI.getTags(),
        leadSourceAPI.getLeadSources(),
      ]);

      setCountries(countriesRes.countries || []);
      setStatuses(statusesRes.statuses || []);
      setUsers(usersRes.data || usersRes.users || []);
      setTags(tagsRes.tags || []);
      setLeadSources(leadSourcesRes.leadSources || []);
    } catch (error) {
      console.error('Error loading lookup data:', error);
      toast.error('Failed to load form data');
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
      toast.error(t('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('File too large. Maximum size is 2MB.'));
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
          toast.success('New tag created');
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          // Tag was just created by another user, reload tags
          await loadLookupData();
          const reloadedTag = tags.find(t => t.name_en.toLowerCase() === newTagName.toLowerCase());
          if (reloadedTag) tagId = reloadedTag.id;
        } else {
          toast.error('Failed to create tag');
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
            toast.error('Contact saved but avatar upload failed');
          } finally {
            setUploadingAvatar(false);
          }
        }

        toast.success(contact ? t('contactUpdated') : t('contactCreated'));
        onSave();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error(error.message || 'Failed to save contact');
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
            <div className="space-y-5">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center overflow-hidden border-2 border-indigo-300 shadow-sm">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-indigo-600" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {avatarPreview ? t('changeAvatar') : t('uploadAvatar')}
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('remove')}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG or WEBP. Max 2MB
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('contactDetails')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('name')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder={t('name')}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('phone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="+1234567890"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('position')}
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder={t('position')}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('status')}
                    </label>
                    <SearchableSelect
                      value={formData.status_id}
                      onChange={(value) => setFormData(prev => ({ ...prev, status_id: value || '' }))}
                      options={[
                        { label: t('selectStatus'), value: '' },
                        ...statuses.map(status => ({
                          label: isRTL ? status.name_ar : status.name_en,
                          value: status.id
                        }))
                      ]}
                      placeholder={t('selectStatus')}
                      displayKey="label"
                      valueKey="value"
                    />
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('tags')}
                    </label>

                    {/* Tag Input */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                        placeholder={t('addTag')}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {t('add')}
                      </button>
                    </div>

                    {/* Tags Display */}
                    {formData.tag_ids.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tag_ids.map((tagId) => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          const tagName = isRTL && tag.name_ar ? tag.name_ar : tag.name_en;
                          return (
                            <span
                              key={tagId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color || '#6366f1' }}
                            >
                              {tagName}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tagId)}
                                className="hover:opacity-80 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('locationInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Country */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('country')}
                    </label>
                    <SearchableSelect
                      value={formData.country_id}
                      onChange={(value) => setFormData(prev => ({ ...prev, country_id: value || '' }))}
                      options={[
                        { label: t('selectCountry'), value: '' },
                        ...countries.map(country => ({
                          label: `${country.flag_emoji} ${isRTL ? country.name_ar : country.name_en}`,
                          value: country.id
                        }))
                      ]}
                      placeholder={t('selectCountry')}
                      displayKey="label"
                      valueKey="value"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('city')}
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder={t('city')}
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('address')}
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder={t('address')}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('additionalInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Lead Source */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('leadSource')}
                    </label>
                    <SearchableSelect
                      value={formData.lead_source}
                      onChange={(value) => setFormData(prev => ({ ...prev, lead_source: value || '' }))}
                      options={[
                        { label: t('selectLeadSource'), value: '' },
                        ...leadSources.map(source => ({
                          label: isRTL && source.name_ar ? source.name_ar : source.name_en,
                          value: source.slug
                        }))
                      ]}
                      placeholder={t('selectLeadSource')}
                      displayKey="label"
                      valueKey="value"
                    />
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('assignedTo')}
                    </label>
                    <SearchableSelect
                      value={formData.assigned_to}
                      onChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value || '' }))}
                      options={[
                        { label: t('selectUser'), value: '' },
                        ...users.map(user => ({
                          label: user.full_name,
                          value: user.id
                        }))
                      ]}
                      placeholder={t('selectUser')}
                      displayKey="label"
                      valueKey="value"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('notes')}
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      placeholder={t('notes')}
                    />
                  </div>
                </div>
              </div>
            </div>

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
