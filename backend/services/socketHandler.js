import conversationStore from './conversationStore.js';

export function setupSocketHandlers(io, whatsappClient) {
  io.on("connection", (socket) => {
    console.log("🔗 Client connected:", socket.id);

    // إرسال حالة الكلايت عند الاتصال
    socket.emit("clientStatus", {
      isReady: whatsappClient.isReady(),
      conversations: conversationStore.getConversations()
    });

    // عند قراءة المحادثة (تصفير العداد)
    socket.on("markAsRead", (chatId) => {
      const success = conversationStore.markAsRead(chatId);
      if (success) {
        // إرسال المحادثات المحدثة للجميع
        io.emit("conversationsUpdated", conversationStore.getConversations());
      }
    });

    // عند انقطاع الاتصال
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  // Middleware لإضافة io للطلبات
  return (req, res, next) => {
    req.io = io;
    next();
  };
}