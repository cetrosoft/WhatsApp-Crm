import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus({ isConnected, whatsappReady }) {
  return (
    <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi size={16} className="text-green-500" />
        ) : (
          <WifiOff size={16} className="text-red-500" />
        )}
        <span className="text-sm">
          {isConnected ? "متصل" : "غير متصل"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            whatsappReady ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-gray-600">
          {whatsappReady ? "الواتساب جاهز" : "الواتساب غير متصل"}
        </span>
      </div>
    </div>
  );
}