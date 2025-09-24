import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Download, Upload, FileText, Users, FileSpreadsheet } from 'lucide-react';

export default function ExportImportToolbar({ selectedChats, allChats, onImportSuccess }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Export contacts
  const handleExport = async (type) => {
    try {
      setIsExporting(true);

      let url = `http://localhost:5000/export-contacts?type=${type}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const filename = `whatsapp_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`تم تصدير ${getTypeLabel(type)} بنجاح`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('فشل في التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  // Download import template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:5000/import-template');

      if (!response.ok) {
        throw new Error('Template download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'contacts_import_template.csv';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('تم تحميل نموذج الاستيراد');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('فشل في تحميل النموذج');
    }
  };

  // Import contacts
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('يرجى اختيار ملف CSV فقط');
      return;
    }

    try {
      setIsImporting(true);

      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('http://localhost:5000/import-contacts', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`تم استيراد ${result.data.imported} جهة اتصال`);
        if (result.data.errors > 0) {
          toast.error(`${result.data.errors} صف يحتوي على أخطاء`);
          console.log('Import errors:', result.data.errorDetails);
        }

        // Callback to refresh data
        if (onImportSuccess) {
          onImportSuccess(result.data);
        }
      } else {
        toast.error(result.message || 'فشل في الاستيراد');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('فشل في استيراد الملف');
    } finally {
      setIsImporting(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'contacts': return 'جهات الاتصال';
      case 'groups': return 'المجموعات';
      case 'selected': return 'المحدد';
      default: return 'الكل';
    }
  };

  const selectedContactsCount = selectedChats.length;
  const contactsCount = allChats.filter(c => !c.isGroup).length;
  const groupsCount = allChats.filter(c => c.isGroup).length;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Export Section */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير جهات الاتصال
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport('all')}
              disabled={isExporting || allChats.length === 0}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FileSpreadsheet className="h-3 w-3" />
              الكل ({allChats.length})
            </button>

            <button
              onClick={() => handleExport('contacts')}
              disabled={isExporting || contactsCount === 0}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              أفراد ({contactsCount})
            </button>

            <button
              onClick={() => handleExport('groups')}
              disabled={isExporting || groupsCount === 0}
              className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              مجموعات ({groupsCount})
            </button>

            {selectedContactsCount > 0 && (
              <button
                onClick={() => handleExport('selected')}
                disabled={isExporting}
                className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FileSpreadsheet className="h-3 w-3" />
                المحدد ({selectedContactsCount})
              </button>
            )}
          </div>
        </div>

        {/* Import Section */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            استيراد جهات الاتصال
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 flex items-center gap-1"
            >
              <FileText className="h-3 w-3" />
              تحميل النموذج
            </button>

            <label className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 cursor-pointer flex items-center gap-1">
              <Upload className="h-3 w-3" />
              {isImporting ? 'جاري الاستيراد...' : 'استيراد ملف'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {(isExporting || isImporting) && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          {isExporting ? 'جاري التصدير...' : 'جاري الاستيراد...'}
        </div>
      )}
    </div>
  );
}