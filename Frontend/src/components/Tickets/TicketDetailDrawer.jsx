/**
 * Ticket Detail Drawer Component
 * Comprehensive read-only view with tabs: Details, Comments, History, Attachments
 *
 * @reusable
 * @category Tickets
 * @example
 * <TicketDetailDrawer
 *   ticket={selectedTicket}
 *   onClose={() => setShowDrawer(false)}
 *   onEdit={() => handleEdit(ticket)}
 * />
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Edit2,
  User,
  Calendar,
  Clock,
  Building2,
  Phone,
  Mail,
  Briefcase,
  MessageSquare,
  Paperclip,
  History,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissionUtils';
import { ticketAPI } from '../../services/api';
import { TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge } from './index';

const TicketDetailDrawer = ({ ticket, onClose, onEdit }) => {
  const { t, i18n } = useTranslation(['common']);
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('details');
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const canEdit = hasPermission(user, 'tickets.edit');

  // Load additional data when tab changes
  useEffect(() => {
    if (!ticket) return;

    if (activeTab === 'comments') {
      loadComments();
    } else if (activeTab === 'attachments') {
      loadAttachments();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, ticket]);

  /**
   * Load ticket comments
   */
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getComments(ticket.id);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error(t('failedToLoad', { resource: t('comments') }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load ticket attachments
   */
  const loadAttachments = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getAttachments(ticket.id);
      setAttachments(response.data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error(t('failedToLoad', { resource: t('attachments') }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load ticket history
   */
  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getHistory(ticket.id);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error(t('failedToLoad', { resource: t('history') }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!ticket) return null;

  const tabs = [
    { id: 'details', label: t('details'), icon: Briefcase },
    { id: 'comments', label: t('comments'), icon: MessageSquare, count: comments.length },
    { id: 'attachments', label: t('attachments'), icon: Paperclip, count: attachments.length },
    { id: 'history', label: t('history'), icon: History }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'right-0'} w-full max-w-2xl bg-white shadow-xl overflow-hidden flex flex-col`}
        style={{
          animation: isRTL ? 'slideInFromLeft 0.3s ease-out' : 'slideInFromRight 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono opacity-90">{ticket.ticket_number}</div>
                <h2 className="text-xl font-semibold">{ticket.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => onEdit(ticket)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                  title={t('edit')}
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                title={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <TicketStatusBadge status={ticket.status} size="sm" />
            <TicketPriorityBadge priority={ticket.priority} size="sm" />
            {ticket.category && (
              <TicketCategoryBadge
                slug={ticket.category.slug}
                nameEn={ticket.category.name_en}
                nameAr={ticket.category.name_ar}
                color={ticket.category.color}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <DetailsTab ticket={ticket} formatDate={formatDate} isRTL={isRTL} t={t} />
          )}

          {activeTab === 'comments' && (
            <CommentsTab comments={comments} loading={loading} formatDate={formatDate} t={t} />
          )}

          {activeTab === 'attachments' && (
            <AttachmentsTab
              attachments={attachments}
              loading={loading}
              formatDate={formatDate}
              formatFileSize={formatFileSize}
              t={t}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab history={history} loading={loading} formatDate={formatDate} t={t} />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Details Tab Component
 */
const DetailsTab = ({ ticket, formatDate, isRTL, t }) => {
  return (
    <div className="space-y-6">
      {/* Description */}
      {ticket.description && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('description')}</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
      )}

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assigned To */}
        {ticket.assigned_user && (
          <InfoCard
            icon={User}
            label={t('assignedTo')}
            value={ticket.assigned_user.full_name || ticket.assigned_user.email}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
        )}

        {/* Created By */}
        {ticket.creator && (
          <InfoCard
            icon={User}
            label={t('createdBy')}
            value={ticket.creator.full_name || ticket.creator.email}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
        )}

        {/* Close Date */}
        {ticket.due_date && (
          <InfoCard
            icon={Calendar}
            label={t('ticketDueDate')}
            value={formatDate(ticket.due_date)}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
        )}

        {/* Created At */}
        <InfoCard
          icon={Clock}
          label={t('ticketCreatedAt')}
          value={formatDate(ticket.created_at)}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
        />
      </div>

      {/* Related Information */}
      {(ticket.contact || ticket.company || ticket.deal) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('relatedInformation')}</h3>
          <div className="space-y-2">
            {/* Contact */}
            {ticket.contact && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{ticket.contact.name}</div>
                    {ticket.contact.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{ticket.contact.phone}</span>
                      </div>
                    )}
                    {ticket.contact.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Mail className="w-3 h-3" />
                        <span>{ticket.contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Company */}
            {ticket.company && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{ticket.company.name}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Deal */}
            {ticket.deal && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Briefcase className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{ticket.deal.title}</div>
                    {ticket.deal.value && (
                      <div className="text-xs text-gray-600 mt-1">
                        {t('dealValue')}: ${ticket.deal.value.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {ticket.tag_details && ticket.tag_details.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('ticketTags')}</h3>
          <div className="flex flex-wrap gap-2">
            {ticket.tag_details.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                  color: tag.color || '#374151'
                }}
              >
                <Tag className="w-3 h-3" />
                {isRTL && tag.name_ar ? tag.name_ar : tag.name_en}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Comments Tab Component
 */
const CommentsTab = ({ comments, loading, formatDate, t }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('noComments')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {comment.user?.full_name || comment.user?.email}
                </span>
                {comment.is_internal && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    {t('internal')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{comment.comment}</p>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(comment.created_at)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Attachments Tab Component
 */
const AttachmentsTab = ({ attachments, loading, formatDate, formatFileSize, t }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-12">
        <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('noAttachments')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50 transition"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Paperclip className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{attachment.file_name}</div>
              <div className="text-xs text-gray-600 mt-1">{formatFileSize(attachment.file_size)}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <User className="w-3 h-3" />
                {attachment.uploader?.full_name}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(attachment.created_at)}
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

/**
 * History Tab Component
 */
const HistoryTab = ({ history, loading, formatDate, t }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      <div className="space-y-4">
        {history.map((entry, index) => (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline Dot */}
            <div className="w-8 h-8 bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-900 capitalize">{entry.action.replace('_', ' ')}</span>
                {entry.field_changed && (
                  <span className="text-xs text-gray-500">• {entry.field_changed}</span>
                )}
              </div>

              {(entry.old_value || entry.new_value) && (
                <div className="text-sm text-gray-700 mb-2">
                  {entry.old_value && <span className="line-through text-gray-500">{entry.old_value}</span>}
                  {entry.old_value && entry.new_value && <span className="mx-2">→</span>}
                  {entry.new_value && <span className="font-medium">{entry.new_value}</span>}
                </div>
              )}

              <div className="text-xs text-gray-500 flex items-center gap-2">
                {entry.user && (
                  <>
                    <User className="w-3 h-3" />
                    <span>{entry.user.full_name || entry.user.email}</span>
                    <span>•</span>
                  </>
                )}
                <Clock className="w-3 h-3" />
                <span>{formatDate(entry.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Info Card Component
 */
const InfoCard = ({ icon: Icon, label, value, iconBg, iconColor }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-600 mb-1">{label}</div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailDrawer;
