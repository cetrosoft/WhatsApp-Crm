/**
 * ConfirmDialog Component
 * Reusable confirmation dialog for destructive actions
 */

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false
}) => {
  const { t } = useTranslation('common');

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-600 bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: 'text-yellow-600 bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    info: {
      icon: 'text-blue-600 bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 end-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentVariant.icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelText || t('cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${currentVariant.button}`}
            >
              {isLoading ? t('loading') : (confirmText || t('confirm'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
