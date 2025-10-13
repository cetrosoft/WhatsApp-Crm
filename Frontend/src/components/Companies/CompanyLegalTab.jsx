/**
 * Company Legal Info Tab
 * Legal documents and IDs
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, File, Trash2 } from 'lucide-react';

const CompanyLegalTab = ({
  formData,
  setFormData,
  uploading,
  handleDocumentUpload,
  handleDeleteDocument,
}) => {
  const { t, i18n } = useTranslation('common');

  return (
    <div className="space-y-3">
      {/* Tax ID + Commercial ID (2 columns) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('taxId')}
          </label>
          <input
            type="text"
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('commercialId')}
          </label>
          <input
            type="text"
            value={formData.commercial_id}
            onChange={(e) => setFormData({ ...formData, commercial_id: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Legal Documents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('legalDocuments')}
        </label>

        {/* Upload Button */}
        <label className="cursor-pointer">
          <input
            type="file"
            onChange={handleDocumentUpload}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-fit">
            <Upload className="w-4 h-4" />
            {uploading ? t('loading') : t('uploadDocument')}
          </div>
        </label>

        {/* Documents List */}
        {formData.legal_docs && formData.legal_docs.length > 0 && (
          <div className="mt-4 space-y-2">
            {formData.legal_docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {doc.name}
                    </div>
                    {doc.uploaded_at && (
                      <div className="text-xs text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString(
                          i18n.language === 'ar' ? 'ar-SA' : 'en-US'
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLegalTab;
