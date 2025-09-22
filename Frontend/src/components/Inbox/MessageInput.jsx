import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Smile, Mic } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import FileAttachment from './FileAttachment';
import MentionAutocomplete from './MentionAutocomplete';

export default function MessageInput({
  reply,
  setReply,
  sendReply,
  whatsappReady,
  replyToMessage,
  setReplyToMessage,
  activeChat,
  onMentionInsert
}) {
  const textareaRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const [groupMembers, setGroupMembers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleSend = () => {
    sendReply(selectedFile, replyToMessage);
    setSelectedFile(null);
    if (setReplyToMessage) {
      setReplyToMessage(null);
    }
    // Reset textarea height immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = reply;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + emoji + after;

      setReply(newText);

      // Set cursor position after emoji immediately
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }
    setShowEmojiPicker(false);
  };

  const handleVoiceSend = async (audioBlob, duration) => {
    // Convert audio blob to base64 for sending
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      // You can implement voice message sending here
      console.log('Voice message recorded:', { base64, duration });
      // For now, just show a message
      alert(`تم تسجيل رسالة صوتية لمدة ${duration} ثانية`);
    };
    reader.readAsDataURL(audioBlob);
    setShowVoiceRecorder(false);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    console.log('File selected:', file);
  };

  const handleBlur = () => {
    // Reset height when losing focus
    if (textareaRef.current && !reply.trim()) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleInput = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setReply(value);
    setCursorPosition(cursorPos);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

    // Handle @ mentions for groups
    if (activeChat?.isGroup) {
      handleMentionDetection(value, cursorPos);
    }
  };

  // Fetch group members when activeChat changes
  useEffect(() => {
    if (activeChat?.isGroup) {
      fetchGroupMembers();
    } else {
      setGroupMembers([]);
      setShowMentions(false);
    }
  }, [activeChat?.id]);

  const fetchGroupMembers = async () => {
    try {
      console.log('Fetching group members for:', activeChat.id);
      const response = await fetch(`http://localhost:5000/group-members/${activeChat.id}`);
      const data = await response.json();
      if (response.ok) {
        console.log('Group members fetched:', data.members);
        setGroupMembers(data.members || []);
      } else {
        console.error('Error response:', data);
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
    }
  };

  const handleMentionDetection = (text, cursorPos) => {
    // Find the last @ before cursor position
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by space/newline (valid mention start)
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const isValidMentionStart = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;

      if (isValidMentionStart) {
        // Check if there's a space between @ and cursor (which would end the mention)
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
          // We're in a mention
          setMentionStartPos(lastAtIndex);
          setMentionQuery(textAfterAt);
          setShowMentions(true);
          console.log('Mention detected:', { query: textAfterAt, members: groupMembers.length });
          return;
        }
      }
    }

    // Not in a mention
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartPos(-1);
  };

  const handleMentionSelect = (member) => {
    if (!member || mentionStartPos === -1) {
      setShowMentions(false);
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const beforeMention = reply.substring(0, mentionStartPos);
      const afterMention = reply.substring(mentionStartPos + mentionQuery.length + 1); // +1 for @

      const mentionText = `@${member.name || member.number} `;
      const newText = beforeMention + mentionText + afterMention;

      setReply(newText);

      // Set cursor position after mention immediately
      const newCursorPos = mentionStartPos + mentionText.length;
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }

    setShowMentions(false);
    setMentionQuery('');
    setMentionStartPos(-1);

    // Callback for parent component
    if (onMentionInsert) {
      onMentionInsert(member);
    }
  };

  return (
    <div className="p-4 border-t border-gray-300 bg-gray-100 flex-shrink-0">
      {/* Reply Preview */}
      {replyToMessage && (
        <div className="mb-3 bg-white rounded-lg border-r-4 border-r-blue-500 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
              </svg>
              <span className="text-sm font-medium text-blue-600">
                الرد على {replyToMessage.sender === 'me' ? 'رسالتك' : replyToMessage.senderName || 'الرسالة'}
              </span>
            </div>
            <button
              onClick={() => setReplyToMessage && setReplyToMessage(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-600 border-r-2 border-r-gray-200 pr-2" style={{ direction: 'rtl' }}>
            {replyToMessage.media && (
              <span className="text-blue-600">📎 {replyToMessage.media.filename || 'ملف مرفق'} </span>
            )}
            {replyToMessage.text && (
              <span>{replyToMessage.text.length > 50 ? replyToMessage.text.substring(0, 50) + '...' : replyToMessage.text}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 items-end max-w-full">
        {/* Text Input with toolbar icons on the left */}
        <div className="flex-1 relative min-w-0 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#464775] focus-within:border-transparent">
          <div className="flex items-end">
            {/* Left toolbar icons */}
            <div className="flex gap-1 items-center p-2 border-l border-[#e1dfdd]">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-[#6264a7] hover:text-[#464775] hover:bg-[#f0f0f8] rounded-full p-2 transition-colors"
                disabled={!whatsappReady}
                title="إيموجي"
              >
                <Smile size={20} />
              </button>
              <FileAttachment
                onFileSelect={handleFileSelect}
                whatsappReady={whatsappReady}
              />
            </div>

            {/* Text input area */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={handleInput}
                onBlur={handleBlur}
                placeholder={activeChat?.isGroup ? "اكتب رسالة... (استخدم @ للإشارة)" : "اكتب رسالة..."}
                className="w-full px-4 py-3 focus:outline-none resize-none bg-transparent border-none min-w-0"
                onKeyDown={(e) => {
                  if (showMentions) {
                    // Let MentionAutocomplete handle keyboard events
                    return;
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (reply.trim() && whatsappReady) {
                      handleSend();
                    }
                  }
                }}
                onSelect={(e) => {
                  setCursorPosition(e.target.selectionStart);
                  if (activeChat?.isGroup) {
                    handleMentionDetection(reply, e.target.selectionStart);
                  }
                }}
                disabled={!whatsappReady}
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  direction: 'rtl',
                  textAlign: 'right'
                }}
              />

              {/* Mention Autocomplete */}
              <MentionAutocomplete
                isVisible={showMentions && activeChat?.isGroup}
                searchQuery={mentionQuery}
                members={groupMembers}
                onSelectMember={handleMentionSelect}
                position={{
                  bottom: '100%',
                  left: 0
                }}
              />

              {/* Emoji Picker */}
              <EmojiPicker
                isOpen={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          </div>
        </div>

        {/* Send/Voice button */}
        {reply.trim() ? (
          <button
            onClick={handleSend}
            disabled={!whatsappReady}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setShowVoiceRecorder(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105"
            disabled={!whatsappReady}
            title="رسالة صوتية"
          >
            <Mic size={20} />
          </button>
        )}
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">📎 {selectedFile.name}</span>
            <span className="text-xs text-gray-500">
              ({Math.round(selectedFile.size / 1024)}KB)
            </span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Voice Recorder Modal */}
      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onSendVoice={handleVoiceSend}
        whatsappReady={whatsappReady}
      />

      {!whatsappReady && (
        <div className="flex items-center justify-center mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <p className="text-xs text-red-600 font-medium">
            الواتساب غير متصل - لا يمكن إرسال الرسائل
          </p>
        </div>
      )}
    </div>
  );
}