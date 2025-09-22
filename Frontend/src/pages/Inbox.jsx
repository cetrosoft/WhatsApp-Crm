import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

// Import components
import ConnectionStatus from "../components/Inbox/ConnectionStatus";
import SearchBar from "../components/Inbox/SearchBar";
import ChatList from "../components/Inbox/ChatList";
import ChatHeader from "../components/Inbox/ChatHeader";
import MessageList from "../components/Inbox/MessageList";
import MessageInput from "../components/Inbox/MessageInput";
import EmptyState from "../components/Inbox/EmptyState";

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [whatsappReady, setWhatsappReady] = useState(false);
  const [socket, setSocket] = useState(null);

  // 🔌 تكوين Socket.io
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // حالة الاتصال
    newSocket.on("connect", () => {
      console.log("🔗 Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Disconnected from server");
      setIsConnected(false);
    });

    // حالة الواتساب
    newSocket.on("clientStatus", (data) => {
      setWhatsappReady(data.isReady);
      setConversations(data.conversations || []);
    });

    newSocket.on("clientReady", (isReady) => {
      setWhatsappReady(isReady);
      toast.success("✅ الواتساب متصل وجاهز");
    });

    newSocket.on("clientDisconnected", (reason) => {
      setWhatsappReady(false);
      toast.error(`🔴 انقطع الاتصال مع الواتساب: ${reason}`);
    });

    newSocket.on("qrCode", (qr) => {
      toast("📱 يرجى مسح رمز QR في الكونسول", { duration: 10000 });
    });

    // استقبال الرسائل الجديدة
    newSocket.on("newMessage", (data) => {
      setConversations(data.conversations);

      // إشعار إذا لم تكن المحادثة مفتوحة
      if (!activeChat || activeChat.id !== data.chatId) {
        toast(`📩 رسالة جديدة من ${data.chatName}`);
      } else {
        // إذا كانت المحادثة مفتوحة، قم بتحديث الرسائل
        const updatedChat = data.conversations.find(c => c.id === data.chatId);
        if (updatedChat) {
          setMessages(updatedChat.messages || []);
        }
      }
    });

    // استقبال الرسائل المرسلة
    newSocket.on("messageSent", (data) => {
      setConversations(data.conversations);

      // إذا كانت المحادثة النشطة هي نفسها
      if (activeChat && activeChat.id === data.chatId) {
        const updatedChat = data.conversations.find(c => c.id === data.chatId);
        if (updatedChat) {
          setMessages(updatedChat.messages || []);
        }
      }
    });

    // Listen for targeted chat updates (more efficient)
    newSocket.on("chatUpdated", (data) => {
      if (activeChat && activeChat.id === data.chatId && data.chat) {
        setMessages(data.chat.messages || []);
        setActiveChat(data.chat);
      }
    });

    // تحديث المحادثات
    newSocket.on("conversationsUpdated", (updatedConversations) => {
      setConversations(updatedConversations);

      // إذا كانت هناك محادثة نشطة، قم بتحديث رسائلها أيضاً
      if (activeChat) {
        const updatedChat = updatedConversations.find(c => c.id === activeChat.id);
        if (updatedChat) {
          setMessages(updatedChat.messages || []);
          setActiveChat(updatedChat); // Update the active chat state
        }
      }
    });

    // حذف الرسائل
    newSocket.on("messageDeleted", (data) => {
      setConversations(data.conversations);

      // إذا كانت المحادثة النشطة هي نفسها
      if (activeChat && activeChat.id === data.chatId) {
        const updatedChat = data.conversations.find(c => c.id === data.chatId);
        if (updatedChat) {
          setMessages(updatedChat.messages || []);
        }
      }

      toast.success("تم حذف الرسالة");
    });

    // إعادة توجيه الرسائل
    newSocket.on("messageForwarded", (data) => {
      setConversations(data.conversations);

      const successCount = data.results.filter(r => r.success).length;
      const totalCount = data.results.length;

      if (successCount > 0) {
        toast.success(`تم إرسال الرسالة إلى ${successCount} من ${totalCount} محادثة`);
      }

      if (successCount < totalCount) {
        toast.error(`فشل إرسال الرسالة إلى ${totalCount - successCount} محادثة`);
      }
    });

    // تعديل الرسائل
    newSocket.on("messageEdited", (data) => {
      console.log("📝 Received messageEdited event:", data);
      setConversations(data.conversations);

      // إذا كانت المحادثة النشطة هي نفسها
      if (activeChat && activeChat.id === data.chatId) {
        const updatedChat = data.conversations.find(c => c.id === data.chatId);
        if (updatedChat) {
          setMessages(updatedChat.messages || []);
          console.log("📝 Updated messages for active chat:", updatedChat.messages.length);
        }
      }

      toast.success("تم تعديل الرسالة");
    });

    // تنظيف عند الانهاء
    return () => {
      newSocket.close();
    };
  }, [activeChat]);

  // ✅ فتح محادثة
  const openChat = (chat) => {
    // تحديث المحادثة النشطة
    setActiveChat(chat);
    setMessages(chat.messages || []);

    // إذا كان هناك رسائل غير مقروءة، قم بتصفيرها محلياً أولاً
    if (chat.unread > 0) {
      // تحديث فوري للعدد في الواجهة
      setConversations((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c))
      );

      // إرسال إشارة للسرفر
      if (socket) {
        socket.emit("markAsRead", chat.id);
      }
    }
  };

  // ✉️ إرسال رد
  const sendReply = async (file = null, replyTo = null) => {
    if ((!reply.trim() && !file) || !activeChat) return;

    let messageText = reply.trim();

    // إضافة معلومات الرد إذا كانت موجودة
    if (replyTo) {
      const replyPrefix = `↩️ الرد على: ${replyTo.text ? replyTo.text.substring(0, 50) + (replyTo.text.length > 50 ? '...' : '') : 'رسالة'}\n\n`;
      messageText = replyPrefix + messageText;
    }

    // Optimistic UI update - add message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender: "me",
      text: messageText,
      time: new Date().toLocaleTimeString("ar-EG", { hour12: false }),
      media: file ? { filename: file.name, data: null, size: file.size } : null,
      type: file ? 'media' : 'text',
      timestamp: Date.now(),
      sending: true // Flag to show loading state
    };

    // Add to current messages immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Clear input immediately for better UX
    const originalReply = reply;
    setReply("");

    try {
      const formData = new FormData();
      formData.append('to', activeChat.id);

      if (messageText) {
        formData.append('message', messageText);
      }

      if (file) {
        formData.append('file', file);
      }

      const res = await fetch("http://localhost:5000/reply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        // Remove optimistic message and let socket update handle the real one
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        toast.success("تم إرسال الرسالة ✅");
      } else {
        // Restore input and remove optimistic message on failure
        setReply(originalReply);
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        toast.error("فشل الإرسال ❌");
      }
    } catch (err) {
      console.error("❌ Reply error:", err);
      // Restore input and remove optimistic message on error
      setReply(originalReply);
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      toast.error("خطأ أثناء الإرسال");
    }
  };

  // 🔍 فلترة المحادثات
  const filteredChats = conversations.filter(
    (chat) =>
      (chat.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (chat.number || "").includes(search)
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] md:h-[calc(100vh-5rem)] bg-[#f3f2f1] rounded-xl shadow-lg font-cairo" style={{ overflow: 'hidden', maxWidth: '100%', width: '100%' }}>
      {/* 📋 قائمة المحادثات */}
      <div
        className="w-full md:w-1/3 lg:w-1/4 border-r border-[#e1dfdd] flex flex-col flex-shrink-0 bg-white"
        style={{ minWidth: '0', maxWidth: '350px', overflow: 'hidden' }}
      >
        <ConnectionStatus
          isConnected={isConnected}
          whatsappReady={whatsappReady}
        />

        <SearchBar search={search} setSearch={setSearch} />

        <ChatList
          filteredChats={filteredChats}
          activeChat={activeChat}
          openChat={openChat}
          isConnected={isConnected}
        />
      </div>

      {/* شاشة الشات */}
      <div
        className="flex-1 flex flex-col"
        style={{
          minWidth: '0',
          maxWidth: 'calc(100% - 350px)',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {activeChat ? (
          <>
            <ChatHeader
              activeChat={activeChat}
              onMentionUser={(mentionText) => {
                setReply(prev => prev + mentionText);
                // Focus on message input immediately
                const textarea = document.querySelector('textarea[placeholder*="اكتب رسالة"]');
                if (textarea) textarea.focus();
              }}
            />

            <MessageList messages={messages} chatId={activeChat.id} socket={socket} onReplyToMessage={setReplyToMessage} />

            <MessageInput
              reply={reply}
              setReply={setReply}
              sendReply={sendReply}
              whatsappReady={whatsappReady}
              replyToMessage={replyToMessage}
              setReplyToMessage={setReplyToMessage}
              activeChat={activeChat}
              onMentionInsert={(member) => {
                console.log('Member mentioned:', member);
              }}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}