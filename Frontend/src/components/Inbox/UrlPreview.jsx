import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

export default function UrlPreview({ url, message }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (url) {
      fetchUrlPreview(url);
    }
  }, [url]);

  const fetchUrlPreview = async (targetUrl) => {
    setLoading(true);
    setError(false);

    try {
      // Use a simple URL metadata extraction service or create our own endpoint
      const response = await fetch(`http://localhost:5000/url-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching URL preview:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className={`mt-2 p-3 rounded-lg border ${
        message.sender === "me"
          ? "bg-green-50 border-green-200"
          : "bg-blue-50 border-blue-200"
      }`}>
        <div className="flex items-center gap-2" style={{ direction: 'rtl' }}>
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600">جاري تحميل معاينة الرابط...</span>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className={`mt-2 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${
        message.sender === "me"
          ? "bg-green-50 border-green-200"
          : "bg-blue-50 border-blue-200"
      }`} onClick={handleUrlClick}>
        <div className="flex items-center gap-2" style={{ direction: 'rtl' }}>
          <Globe size={16} className="text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-600 truncate">
              {url}
            </p>
            <p className="text-xs text-gray-500">انقر لفتح الرابط</p>
          </div>
          <ExternalLink size={14} className="text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-2 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity overflow-hidden ${
      message.sender === "me"
        ? "bg-green-50 border-green-200"
        : "bg-blue-50 border-blue-200"
    }`} onClick={handleUrlClick}>
      {/* Preview Image */}
      {preview.image && (
        <div className="w-full h-32 bg-gray-200 overflow-hidden">
          <img
            src={preview.image}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Preview Content */}
      <div className="p-3">
        <div className="flex items-start gap-2" style={{ direction: 'rtl' }}>
          <Globe size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {/* Title */}
            {preview.title && (
              <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                {preview.title}
              </h4>
            )}

            {/* Description */}
            {preview.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {preview.description}
              </p>
            )}

            {/* URL */}
            <div className="flex items-center gap-1">
              <p className="text-xs text-blue-600 font-medium truncate">
                {preview.domain || new URL(url).hostname}
              </p>
              <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}