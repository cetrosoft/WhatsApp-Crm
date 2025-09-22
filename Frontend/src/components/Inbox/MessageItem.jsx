import React, { useState } from 'react';
import { Download, Image } from 'lucide-react';
import MessageContextMenu from './MessageContextMenu';
import DeleteConfirmModal from './DeleteConfirmModal';
import ForwardModal from './ForwardModal';
import EditMessageModal from './EditMessageModal';
import MessageActionsMenu from './MessageActionsMenu';
import UrlPreview from './UrlPreview';
import { toast } from 'react-hot-toast';

export default function MessageItem({ message, chatId, socket, onReplyToMessage }) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMessageHovered, setIsMessageHovered] = useState(false);
  const isImage = (mimetype) => {
    return mimetype && mimetype.startsWith('image/');
  };

  const isVideo = (mimetype) => {
    return mimetype && mimetype.startsWith('video/');
  };

  const isAudio = (mimetype) => {
    return mimetype && mimetype.startsWith('audio/');
  };

  const isLocation = (text) => {
    return text && (
      text.includes('latitude') ||
      text.includes('longitude') ||
      text.includes('https://maps.google.com') ||
      text.includes('https://www.google.com/maps')
    );
  };

  const extractUrls = (text) => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex) || [];
    // Filter out location URLs as they have their own preview
    return urls.filter(url => !isLocation(url));
  };

  const hasUrls = (text) => {
    return extractUrls(text).length > 0;
  };

  const hasVeryLongWords = (text) => {
    if (!text) return false;
    // Check for words longer than 50 characters (likely repeated characters or long URLs)
    const words = text.split(/\s+/);
    return words.some(word => word.length > 50);
  };

  const getMediaUrl = (mediaData) => {
    if (!mediaData || !mediaData.data) return null;
    return `data:${mediaData.mimetype};base64,${mediaData.data}`;
  };

  const downloadMedia = (mediaData, filename) => {
    if (!mediaData || !mediaData.data) return;

    const url = getMediaUrl(mediaData);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || mediaData.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text).then(() => {
        toast.success('تم نسخ النص بنجاح');
      }).catch(() => {
        toast.error('فشل في نسخ النص');
      });
    }
  };

  const handleForward = () => {
    setShowContextMenu(false);
    setShowForwardModal(true);
  };

  const handleForwardConfirm = async (selectedChats) => {
    setIsForwarding(true);
    try {
      const response = await fetch('http://localhost:5000/forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: message.id,
          chatId: chatId,
          targetChats: selectedChats.map(chat => chat.id)
        }),
      });

      const result = await response.json();

      if (result.success) {
        const successCount = result.results.filter(r => r.success).length;
        const totalCount = result.results.length;
        toast.success(`تم إرسال الرسالة إلى ${successCount} من ${totalCount} محادثة`);
        setShowForwardModal(false);
      } else {
        toast.error('فشل في إعادة توجيه الرسالة');
      }
    } catch (error) {
      console.error('Forward error:', error);
      toast.error('حدث خطأ أثناء إعادة توجيه الرسالة');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleDelete = () => {
    setShowContextMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (deleteType) => {
    setIsDeleting(true);
    try {
      const response = await fetch('http://localhost:5000/message', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          messageId: message.id,
          deleteType: deleteType
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم حذف الرسالة بنجاح');
        setShowDeleteModal(false);
        // The real-time update will be handled by Socket.io listener in parent component
      } else {
        toast.error(result.error || 'فشل في حذف الرسالة');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('حدث خطأ أثناء حذف الرسالة');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReply = () => {
    setShowContextMenu(false);
    if (onReplyToMessage) {
      onReplyToMessage(message);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSave = async (newText) => {
    setIsEditing(true);
    try {
      const response = await fetch('http://localhost:5000/message', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          messageId: message.id,
          newText: newText
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم تعديل الرسالة بنجاح');
        setShowEditModal(false);
        // The real-time update will be handled by Socket.io listener in parent component
      } else {
        toast.error(result.error || 'فشل في تعديل الرسالة');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('حدث خطأ أثناء تعديل الرسالة');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="px-2 mb-2 w-full">
      <div
        className={`flex ${
          message.sender === "me" ? "justify-end" : "justify-start"
        } w-full`}
      >
        <div
          className="relative group max-w-[75%]"
          onMouseEnter={() => setIsMessageHovered(true)}
          onMouseLeave={() => setIsMessageHovered(false)}
        >
          <div
            className={`px-4 py-3 cursor-pointer relative ${
              message.sender === "me"
                ? "bg-[#6264a7] text-white rounded-lg shadow-sm"
                : "bg-[#f8f8f8] text-gray-900 rounded-lg shadow-sm border border-gray-100"
            } ${message.sending ? "opacity-70" : ""}`}
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'normal',
              minWidth: '60px',
              width: 'fit-content',
              direction: 'rtl'
            }}
            onContextMenu={handleContextMenu}
          >

        {/* عرض النص إذا وجد */}
        {message.text && !isLocation(message.text) && (
          <div className="mb-1 min-w-0">
            {/* عرض اسم المرسل في الجروب */}
            {message.isGroup && message.senderName && message.sender !== "me" && (
              <div className="mb-2">
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: '#2563eb',
                    direction: 'rtl',
                    textAlign: 'right',
                    display: 'block'
                  }}
                >
                  {message.senderName}
                </span>
              </div>
            )}
            <p
              className="text-sm leading-relaxed"
              style={{
                wordBreak: hasVeryLongWords(message.text) ? 'break-all' : 'normal',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                maxWidth: '100%',
                minWidth: 0,
                width: 'fit-content',
                direction: 'rtl',
                textAlign: 'right',
                unicodeBidi: 'plaintext'
              }}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* عرض الموقع إذا وجد */}
        {message.text && isLocation(message.text) && (
          <div className="mb-1">
            <div className={`p-3 rounded-lg border ${
              message.sender === "me"
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex items-center gap-2 mb-2" style={{ direction: 'rtl' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">📍 موقع جغرافي</span>
              </div>
              <p
                className="text-xs text-gray-600 mb-2"
                style={{
                  direction: 'rtl',
                  unicodeBidi: 'plaintext',
                  textAlign: 'right',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {message.text}
              </p>
              {(message.text.includes('https://maps.google.com') || message.text.includes('https://www.google.com/maps')) && (
                <button
                  onClick={() => {
                    const urlMatch = message.text.match(/(https:\/\/[^\s]+)/);
                    if (urlMatch) {
                      window.open(urlMatch[0], '_blank');
                    }
                  }}
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
                  style={{ direction: 'rtl' }}
                >
                  🗺️ فتح في الخرائط
                </button>
              )}
            </div>
          </div>
        )}

        {/* عرض معاينة الروابط إذا وجدت */}
        {message.text && hasUrls(message.text) && !isLocation(message.text) && (
          <div className="mb-1">
            {extractUrls(message.text).map((url, index) => (
              <UrlPreview
                key={index}
                url={url}
                message={message}
              />
            ))}
          </div>
        )}

        {/* عرض الميديا إذا وجدت */}
        {message.media && !message.media.error && (
          <div className="mt-2">
            {isImage(message.media.mimetype) ? (
              // عرض الصور
              <div className="relative group max-w-full">
                <img
                  src={getMediaUrl(message.media)}
                  alt="صورة مرسلة"
                  className="w-full h-auto rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }}
                  onClick={() => {
                    window.open(getMediaUrl(message.media), '_blank');
                  }}
                />
                {/* زر التحميل للصور */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadMedia(message.media, message.media.filename);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <Download size={14} />
                </button>
              </div>
            ) : isVideo(message.media.mimetype) ? (
              // عرض الفيديوهات
              <div className="relative group max-w-full">
                <video
                  controls
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '200px', maxWidth: '100%' }}
                  preload="metadata"
                >
                  <source src={getMediaUrl(message.media)} type={message.media.mimetype} />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
                {/* زر التحميل للفيديوهات */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadMedia(message.media, message.media.filename);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <Download size={14} />
                </button>
              </div>
            ) : isAudio(message.media.mimetype) ? (
              // عرض الملفات الصوتية
              <div className={`p-3 rounded-lg border ${
                message.sender === "me"
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-full ${
                    message.sender === "me" ? "bg-green-500" : "bg-blue-500"
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">🎵 ملف صوتي</p>
                    <p className="text-xs text-gray-500">{Math.round(message.media.size / 1024)}KB</p>
                  </div>
                </div>
                <audio controls className="w-full mb-2">
                  <source src={getMediaUrl(message.media)} type={message.media.mimetype} />
                  متصفحك لا يدعم تشغيل الصوت
                </audio>
                <button
                  onClick={() => downloadMedia(message.media, message.media.filename)}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  <Download size={12} className="inline mr-1" />
                  تحميل
                </button>
              </div>
            ) : (
              // عرض الملفات الأخرى
              <div className={`flex items-center gap-2 p-2 rounded-lg ${
                message.sender === "me"
                  ? "bg-green-100 border border-green-200"
                  : "bg-gray-100 border border-gray-300"
              }`}>
                <div className={`p-2 rounded-full ${
                  message.sender === "me" ? "bg-green-500" : "bg-gray-500"
                }`}>
                  <Image size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    message.sender === "me" ? "text-gray-800" : "text-gray-900"
                  }`} style={{ direction: 'rtl', unicodeBidi: 'plaintext' }}>
                    {message.media.filename || 'ملف مرفق'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {message.media.mimetype?.split('/')[1]?.toUpperCase()} • {Math.round(message.media.size / 1024)}KB
                  </p>
                </div>
                <button
                  onClick={() => downloadMedia(message.media, message.media.filename)}
                  className="p-1.5 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                >
                  <Download size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* رسالة خطأ إذا فشل تحميل الميديا */}
        {message.media && message.media.error && (
          <div className="mt-2 p-2 bg-red-100/90 border border-red-300/50 rounded text-red-800 text-xs">
            ⚠️ {message.media.message}
          </div>
        )}

        {/* وقت الرسالة */}
        <div className="flex items-end justify-between mt-1">
          <div className="flex items-end gap-1">
            {message.edited && (
              <span className={`text-xs select-none font-medium ${
                message.sender === "me" ? "text-white/80" : "text-blue-500"
              }`}>✏️ محررة</span>
            )}
            <span className={`text-xs select-none ${
              message.sender === "me" ? "text-white/70" : "text-gray-500"
            }`}>
              {message.time}
            </span>
            {message.sender === "me" && (
              message.sending ? (
                <div className="animate-spin w-3 h-3 border border-white/50 border-t-white rounded-full"></div>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 15"
                  className="text-white/70 fill-current"
                >
                  <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.132 3.006c.143.14.361.125.484-.033l5.272-6.048a.366.366 0 0 0-.063-.51z" />
                </svg>
              )
            )}
          </div>
        </div>

          </div>

          {/* Three-dot menu */}
          <MessageActionsMenu
            message={message}
            isMyMessage={message.sender === "me"}
            isParentHovered={isMessageHovered}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReply={handleReply}
            onForward={handleForward}
            onCopy={handleCopy}
          />
        </div>
      </div>

      {/* Context Menu */}
      <MessageContextMenu
        isOpen={showContextMenu}
        position={contextMenuPosition}
        onClose={() => setShowContextMenu(false)}
        onCopy={handleCopy}
        onForward={handleForward}
        onDelete={handleDelete}
        onReply={handleReply}
        message={message}
        isMyMessage={message.sender === "me"}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        message={message}
        isLoading={isDeleting}
      />

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={handleForwardConfirm}
        message={message}
        isLoading={isForwarding}
      />

      {/* Edit Modal */}
      <EditMessageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        message={message}
        isLoading={isEditing}
      />
    </div>
  );
}