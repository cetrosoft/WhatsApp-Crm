import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

export default function VoiceRecorder({ onSendVoice, isOpen, onClose, whatsappReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isRecording) {
      startRecording();
    }

    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isOpen]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('لا يمكن الوصول للميكروفون. يرجى التأكد من إعطاء الإذن.');
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    onClose();
  };

  const sendVoiceMessage = () => {
    if (audioBlob && onSendVoice) {
      onSendVoice(audioBlob, recordingTime);
      deleteRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4" style={{ direction: 'rtl' }}>
        <h3 className="text-lg font-semibold mb-4 text-center">تسجيل رسالة صوتية</h3>

        <div className="flex flex-col items-center space-y-4">
          {/* Recording Animation */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          }`}>
            <Mic size={32} className="text-white" />
          </div>

          {/* Timer */}
          <div className="text-2xl font-mono">
            {formatTime(recordingTime)}
          </div>

          {/* Recording Status */}
          <div className="text-sm text-gray-600 text-center">
            {isRecording ? 'جاري التسجيل...' : audioBlob ? 'تم التسجيل' : 'اضغط للتسجيل'}
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/wav" />
              متصفحك لا يدعم تشغيل الصوت
            </audio>
          )}

          {/* Control Buttons */}
          <div className="flex space-x-3 space-x-reverse">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                title="إيقاف التسجيل"
              >
                <Square size={20} />
              </button>
            ) : audioBlob ? (
              <>
                <button
                  onClick={deleteRecording}
                  className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                  title="حذف التسجيل"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={sendVoiceMessage}
                  disabled={!whatsappReady}
                  className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors disabled:bg-gray-400"
                  title="إرسال الرسالة الصوتية"
                >
                  <Send size={20} />
                </button>
              </>
            ) : null}

            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
          </div>

          {!whatsappReady && (
            <div className="text-xs text-red-600 text-center">
              الواتساب غير متصل - لا يمكن إرسال الرسائل الصوتية
            </div>
          )}
        </div>
      </div>
    </div>
  );
}