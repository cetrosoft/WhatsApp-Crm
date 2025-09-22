import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Search, Wifi, WifiOff, Download, Image } from "lucide-react";
import { io } from "socket.io-client";

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
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

    // تحديث المحادثات
    newSocket.on("conversationsUpdated", (updatedConversations) => {
      setConversations(updatedConversations);
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
  const sendReply = async () => {
    if (!reply.trim() || !activeChat) return;

    try {
      const res = await fetch("http://localhost:5000/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: activeChat.id,
          message: reply,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReply("");
        toast.success("تم إرسال الرسالة ✅");
        // لا حاجة لتحديث الرسائل يدوياً، Socket.io سيتولى الأمر
      } else {
        toast.error("فشل الإرسال ❌");
      }
    } catch (err) {
      console.error("❌ Reply error:", err);
      toast.error("خطأ أثناء الإرسال");
    }
  };

  // تحديد ما إذا كان الملف صورة
  const isImage = (mimetype) => {
    return mimetype && mimetype.startsWith('image/');
  };

  // تحويل base64 إلى URL قابل للعرض
  const getMediaUrl = (mediaData) => {
    if (!mediaData || !mediaData.data) return null;
    return `data:${mediaData.mimetype};base64,${mediaData.data}`;
  };

  // تحميل الملف
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

  // 🔍 فلترة المحادثات
  const filteredChats = conversations.filter(
    (chat) =>
      (chat.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (chat.number || "").includes(search)
  );

  return (
    <div className="flex h-[80vh] bg-white rounded-xl shadow-md overflow-hidden font-cairo">
      {/* 📋 قائمة المحادثات */}
      <div className="w-1/4 border-r border-gray-200 flex flex-col">
        
        {/* حالة الاتصال */}
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

        {/* Search */}
        <div className="p-2 border-b flex items-center gap-2 bg-gray-50">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الرقم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent"
          />
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 && (
            <p className="p-4 text-gray-500 text-center">
              {isConnected ? "لا توجد محادثات" : "انتظار الاتصال..."}
            </p>
          )}
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 cursor-pointer hover:bg-gray-100 flex justify-between items-center border-b border-gray-100 ${
                activeChat?.id === chat.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
              onClick={() => openChat(chat)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">
                    {chat.name || chat.number}
                  </h3>
                  {chat.isGroup && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      جروب
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">
                  {chat.lastMessage}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs min-w-[20px] text-center">
                    {chat.unread}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* شاشة الشات */}
      <div className="flex-1 flex flex-col">
        
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">
                    {activeChat.name || activeChat.number}
                  </h2>
                  {activeChat.isGroup && (
                    <p className="text-xs text-gray-500">جروب واتساب</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">
                    {activeChat.id}
                  </span>
                  <span className="text-xs text-green-600">
                    {activeChat.messages?.length || 0} رسالة
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2" 
              style={{ 
                backgroundColor: '#e5ddd5',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpath d='M25 25h50v50H25z' fill='%23000'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            >
              {messages.length === 0 && (
                <div className="text-center text-gray-600 mt-20">
                  <div className="bg-white/60 backdrop-blur-sm rounded-full p-6 w-32 h-32 mx-auto flex items-center justify-center mb-4 border border-gray-300 shadow-lg">
                    <Search size={50} className="text-gray-500" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">لا توجد رسائل</p>
                  <p className="text-sm text-gray-500">ابدأ محادثة جديدة</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === "me" ? "justify-end" : "justify-start"
                  } mb-1`}
                >
                  <div
                    className={`relative px-3 py-2 shadow-md max-w-xs ${
                      msg.sender === "me"
                        ? "bg-[#dcf8c6] text-gray-800 rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-sm ml-16"
                        : "bg-white text-gray-900 rounded-tl-sm rounded-tr-lg rounded-bl-lg rounded-br-lg border border-gray-200 mr-16"
                    }`}
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      minWidth: '60px'
                    }}
                  >
                    {/* Triangle pointer */}
                    <div
                      className={`absolute w-0 h-0 ${
                        msg.sender === "me"
                          ? "border-l-[8px] border-l-transparent border-t-[8px] border-t-[#dcf8c6] -right-2 bottom-0"
                          : "border-r-[8px] border-r-transparent border-t-[8px] border-t-white -left-2 bottom-0"
                      }`}
                    ></div>

                    {/* عرض النص إذا وجد */}
                    {msg.text && (
                      <div className="mb-1">
                        <p 
                          className="text-sm leading-relaxed"
                          style={{
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            maxWidth: '100%'
                          }}
                        >
                          {msg.text}
                        </p>
                      </div>
                    )}
                    
                    {/* عرض الميديا إذا وجدت */}
                    {msg.media && !msg.media.error && (
                      <div className="mt-2">
                        {isImage(msg.media.mimetype) ? (
                          // عرض الصور
                          <div className="relative group">
                            <img
                              src={getMediaUrl(msg.media)}
                              alt="صورة مرسلة"
                              className="w-full h-auto rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                              style={{ maxHeight: '200px', maxWidth: '250px', objectFit: 'cover' }}
                              onClick={() => {
                                window.open(getMediaUrl(msg.media), '_blank');
                              }}
                            />
                            {/* زر التحميل للصور */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadMedia(msg.media, msg.media.filename);
                              }}
                              className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        ) : (
                          // عرض الملفات الأخرى
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            msg.sender === "me" 
                              ? "bg-green-100 border border-green-200" 
                              : "bg-gray-100 border border-gray-300"
                          }`}>
                            <div className={`p-2 rounded-full ${
                              msg.sender === "me" ? "bg-green-500" : "bg-gray-500"
                            }`}>
                              <Image size={14} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${
                                msg.sender === "me" ? "text-gray-800" : "text-gray-900"
                              }`}>
                                {msg.media.filename || 'ملف مرفق'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {msg.media.mimetype?.split('/')[1]?.toUpperCase()} • {Math.round(msg.media.size / 1024)}KB
                              </p>
                            </div>
                            <button
                              onClick={() => downloadMedia(msg.media, msg.media.filename)}
                              className="p-1.5 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* رسالة خطأ إذا فشل تحميل الميديا */}
                    {msg.media && msg.media.error && (
                      <div className="mt-2 p-2 bg-red-100/90 border border-red-300/50 rounded text-red-800 text-xs">
                        ⚠️ {msg.media.message}
                      </div>
                    )}
                    
                    {/* وقت الرسالة */}
                    <div className="flex items-end justify-end mt-1 gap-1">
                      <span className="text-xs text-gray-500 select-none">
                        {msg.time}
                      </span>
                      {msg.sender === "me" && (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 16 15" 
                          className="text-blue-500 fill-current"
                        >
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.132 3.006c.143.14.361.125.484-.033l5.272-6.048a.366.366 0 0 0-.063-.51z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-gray-300 bg-gray-100">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="اكتب رسالة..."
                    className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32 bg-white"
                    onKeyDown={(e) => {
                      // Enter فقط للسطر الجديد، لا للإرسال
                      if (e.key === "Enter" && e.shiftKey) {
                        // السماح بالسطر الجديد مع Shift+Enter
                        return;
                      }
                      // منع الإرسال بـ Enter
                    }}
                    disabled={!whatsappReady}
                    rows={1}
                    style={{
                      minHeight: '48px',
                      maxHeight: '120px',
                      overflowY: 'auto'
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                  {/* أيقونة الإيموجي */}
                  <button 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={!whatsappReady}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                      <circle cx="8.5" cy="10.5" r="1.5"/>
                      <circle cx="15.5" cy="10.5" r="1.5"/>
                      <path d="M12 18c-2 0-3.5-1.5-3.5-3.5h7c0 2-1.5 3.5-3.5 3.5z"/>
                    </svg>
                  </button>
                </div>
                
                {/* زر الإرسال - فقط بالضغط على الزر */}
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || !whatsappReady}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    reply.trim() && whatsappReady
                      ? "bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
              
              {!whatsappReady && (
                <div className="flex items-center justify-center mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <p className="text-xs text-red-600 font-medium">
                    الواتساب غير متصل - لا يمكن إرسال الرسائل
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">اختر محادثة</h3>
              <p className="text-sm text-gray-400">
                اختر محادثة من القائمة لعرض الرسائل والرد عليها
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}