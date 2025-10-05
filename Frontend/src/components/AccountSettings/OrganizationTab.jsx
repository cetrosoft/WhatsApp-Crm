/**
 * Organization Tab
 * Manage organization information (name, domain, logo, business details, address)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { organizationAPI } from '../../services/api';
import { Building2, Upload, Mail, Phone, Globe, MapPin, FileText, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const OrganizationTab = () => {
  const { t, i18n } = useTranslation('settings');
  const { organization: authOrg } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    tax_id: '',
    commercial_id: '',
  });

  // Countries list
  const countries = [
    { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية' },
    { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة' },
    { code: 'EG', name: 'Egypt', nameAr: 'مصر' },
    { code: 'JO', name: 'Jordan', nameAr: 'الأردن' },
    { code: 'KW', name: 'Kuwait', nameAr: 'الكويت' },
    { code: 'BH', name: 'Bahrain', nameAr: 'البحرين' },
    { code: 'QA', name: 'Qatar', nameAr: 'قطر' },
    { code: 'OM', name: 'Oman', nameAr: 'عمان' },
    { code: 'LB', name: 'Lebanon', nameAr: 'لبنان' },
    { code: 'IQ', name: 'Iraq', nameAr: 'العراق' },
    { code: 'SY', name: 'Syria', nameAr: 'سوريا' },
    { code: 'YE', name: 'Yemen', nameAr: 'اليمن' },
    { code: 'PS', name: 'Palestine', nameAr: 'فلسطين' },
    { code: 'LY', name: 'Libya', nameAr: 'ليبيا' },
    { code: 'TN', name: 'Tunisia', nameAr: 'تونس' },
    { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر' },
    { code: 'MA', name: 'Morocco', nameAr: 'المغرب' },
    { code: 'SD', name: 'Sudan', nameAr: 'السودان' },
    { code: 'SO', name: 'Somalia', nameAr: 'الصومال' },
    { code: 'DJ', name: 'Djibouti', nameAr: 'جيبوتي' },
    { code: 'KM', name: 'Comoros', nameAr: 'جزر القمر' },
    { code: 'MR', name: 'Mauritania', nameAr: 'موريتانيا' },
    { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة' },
    { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة' },
    { code: 'CA', name: 'Canada', nameAr: 'كندا' },
    { code: 'AU', name: 'Australia', nameAr: 'أستراليا' },
    { code: 'DE', name: 'Germany', nameAr: 'ألمانيا' },
    { code: 'FR', name: 'France', nameAr: 'فرنسا' },
    { code: 'IT', name: 'Italy', nameAr: 'إيطاليا' },
    { code: 'ES', name: 'Spain', nameAr: 'إسبانيا' },
    { code: 'NL', name: 'Netherlands', nameAr: 'هولندا' },
    { code: 'BE', name: 'Belgium', nameAr: 'بلجيكا' },
    { code: 'CH', name: 'Switzerland', nameAr: 'سويسرا' },
    { code: 'AT', name: 'Austria', nameAr: 'النمسا' },
    { code: 'SE', name: 'Sweden', nameAr: 'السويد' },
    { code: 'NO', name: 'Norway', nameAr: 'النرويج' },
    { code: 'DK', name: 'Denmark', nameAr: 'الدنمارك' },
    { code: 'FI', name: 'Finland', nameAr: 'فنلندا' },
    { code: 'PL', name: 'Poland', nameAr: 'بولندا' },
    { code: 'TR', name: 'Turkey', nameAr: 'تركيا' },
    { code: 'IN', name: 'India', nameAr: 'الهند' },
    { code: 'PK', name: 'Pakistan', nameAr: 'باكستان' },
    { code: 'BD', name: 'Bangladesh', nameAr: 'بنغلاديش' },
    { code: 'CN', name: 'China', nameAr: 'الصين' },
    { code: 'JP', name: 'Japan', nameAr: 'اليابان' },
    { code: 'KR', name: 'South Korea', nameAr: 'كوريا الجنوبية' },
    { code: 'MY', name: 'Malaysia', nameAr: 'ماليزيا' },
    { code: 'ID', name: 'Indonesia', nameAr: 'إندونيسيا' },
    { code: 'SG', name: 'Singapore', nameAr: 'سنغافورة' },
    { code: 'TH', name: 'Thailand', nameAr: 'تايلاند' },
    { code: 'PH', name: 'Philippines', nameAr: 'الفلبين' },
    { code: 'VN', name: 'Vietnam', nameAr: 'فيتنام' },
    { code: 'BR', name: 'Brazil', nameAr: 'البرازيل' },
    { code: 'MX', name: 'Mexico', nameAr: 'المكسيك' },
    { code: 'AR', name: 'Argentina', nameAr: 'الأرجنتين' },
    { code: 'ZA', name: 'South Africa', nameAr: 'جنوب أفريقيا' },
    { code: 'NG', name: 'Nigeria', nameAr: 'نيجيريا' },
    { code: 'KE', name: 'Kenya', nameAr: 'كينيا' },
    { code: 'RU', name: 'Russia', nameAr: 'روسيا' },
    { code: 'UA', name: 'Ukraine', nameAr: 'أوكرانيا' },
  ];
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch organization details on mount
  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      const { organization } = await organizationAPI.getCurrent();

      setFormData({
        name: organization.name || '',
        slug: organization.slug || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
        postal_code: organization.postal_code || '',
        tax_id: organization.tax_id || '',
        commercial_id: organization.commercial_id || '',
      });

      if (organization.logo_url) {
        setLogoPreview(organization.logo_url);
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      toast.error(t('failedToLoad', { ns: 'common' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('invalidFileType'));
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('fileTooLarge'));
      return;
    }

    // Upload logo
    try {
      setIsUploadingLogo(true);
      const { logo_url } = await organizationAPI.uploadLogo(file);
      setLogoPreview(logo_url);
      toast.success(t('logoUploaded'));
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(error.message || t('failedToUpload'));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { organization } = await organizationAPI.update(formData);

      // Update local state with response
      setFormData(prev => ({
        ...prev,
        ...organization,
      }));

      toast.success(t('settingsSaved'));
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || t('failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t('loading', { ns: 'common' })}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('organizationInfo')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('updateOrganizationInfo')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload - Compact at Top */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden shadow-sm flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-2 text-start flex items-center gap-2">
                <Image className="w-4 h-4" />
                {t('companyLogo')}
              </h3>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                {isUploadingLogo ? t('uploading') : t('uploadLogo')}
              </button>
              <p className="mt-2 text-xs text-gray-500 text-start">
                {t('logoRequirements')}
              </p>
            </div>
          </div>
        </div>

        {/* All Fields in Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name - Full Width */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('companyName')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full ps-11 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full ps-11 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('phone')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={isRTL ? 'w-full ps-4 pe-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start' : 'w-full ps-11 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start'}
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('website')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Globe className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                className="w-full ps-11 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
              />
            </div>
          </div>

          {/* Organization Slug - Read Only */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('organizationSlug')}
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              readOnly
              className="w-full ps-4 pe-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-start cursor-not-allowed"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('taxId')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                className="w-full ps-11 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
              />
            </div>
          </div>

          {/* Commercial ID */}
          <div>
            <label htmlFor="commercial_id" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('commercialId')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="commercial_id"
                name="commercial_id"
                value={formData.commercial_id}
                onChange={handleChange}
                className="w-full ps-11 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
              />
            </div>
          </div>

          {/* Street Address - Full Width */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('address')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full ps-11 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('city')}
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full ps-4 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
            />
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('state')}
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full ps-4 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('country')}
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full ps-4 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start bg-white text-sm"
            >
              <option value="" className="py-1">{t('selectCountry')}</option>
              {countries.map((country) => (
                <option key={country.code} value={country.name} className="py-1">
                  {i18n.language === 'ar' ? country.nameAr : country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t('postalCode')}
            </label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className="w-full ps-4 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-start"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isSaving ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationTab;
