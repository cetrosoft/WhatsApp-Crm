import React, { useRef } from 'react';
import { Upload, Image, FileText, File } from 'lucide-react';

export default function FileAttachment({ onFileSelect, whatsappReady }) {
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input
    event.target.value = '';
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image size={16} />;
    } else if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FileText size={16} />;
    } else {
      return <File size={16} />;
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        disabled={!whatsappReady}
      />

      <button
        onClick={handleFileClick}
        disabled={!whatsappReady}
        className="p-2 text-[#6264a7] hover:text-[#464775] hover:bg-[#f0f0f8] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="إرفاق ملف"
      >
        <Upload size={20} />
      </button>
    </div>
  );
}