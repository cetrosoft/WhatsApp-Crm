class ConversationStore {
  constructor() {
    this.conversations = [];
  }

  addIncomingMessage(from, name, message, isGroup = false, media = null, senderName = null, originalTimestamp = null) {
    let chat = this.conversations.find((c) => c.id === from);
    if (!chat) {
      chat = {
        id: from,
        name: name || from,
        number: isGroup ? null : from.split("@")[0],
        isGroup,
        messages: [],
        unread: 0,
      };
      this.conversations.push(chat);
    }

    const messageText = media ? (message || "📎 مرفق") : message;
    const displayMessage = isGroup && senderName ? `${senderName}: ${messageText}` : messageText;
    chat.lastMessage = displayMessage;

    // Use original timestamp if provided, otherwise use current time
    const messageTimestamp = originalTimestamp || Date.now();
    const messageTime = new Date(messageTimestamp).toLocaleTimeString("ar-EG", { hour12: false });

    const messageObj = {
      id: Date.now() + Math.random().toString(36).substr(2, 9), // Simple unique message ID
      sender: from,
      text: message,
      time: messageTime,
      media: media,
      type: media ? 'media' : 'text',
      senderName: senderName, // Add sender name for group messages
      isGroup: isGroup,
      timestamp: messageTimestamp
    };

    chat.messages.push(messageObj);
    chat.unread = (chat.unread || 0) + 1;

    return { chat, messageText: displayMessage, media };
  }

  addOutgoingMessage(to, message, media = null) {
    let chat = this.conversations.find((c) => c.id === to);
    if (chat) {
      const messageText = media ? (message || "📎 مرفق") : message;

      const messageObj = {
        id: Date.now() + Math.random().toString(36).substr(2, 9), // Unique message ID
        sender: "me",
        text: message,
        time: new Date().toLocaleTimeString("ar-EG", { hour12: false }),
        media: media,
        type: media ? 'media' : 'text',
        timestamp: Date.now()
      };

      chat.messages.push(messageObj);
      chat.lastMessage = messageText;

      return { messageText, media };
    }
    return null;
  }

  markAsRead(chatId) {
    const chat = this.conversations.find(c => c.id === chatId);
    if (chat) {
      chat.unread = 0;
      return true;
    }
    return false;
  }

  getConversations() {
    return this.conversations;
  }

  findConversation(chatId) {
    return this.conversations.find(c => c.id === chatId);
  }

  deleteMessage(chatId, messageId) {
    const chat = this.conversations.find(c => c.id === chatId);
    if (chat) {
      const messageIndex = chat.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        const deletedMessage = chat.messages[messageIndex];
        chat.messages.splice(messageIndex, 1);

        // Update last message if the deleted message was the latest
        if (chat.messages.length === 0) {
          chat.lastMessage = "لا توجد رسائل";
        } else if (messageIndex === chat.messages.length) {
          // If we deleted the last message, update with the new last message
          const lastMessage = chat.messages[chat.messages.length - 1];
          const messageText = lastMessage.media ? (lastMessage.text || "📎 مرفق") : lastMessage.text;
          chat.lastMessage = lastMessage.isGroup && lastMessage.senderName ?
            `${lastMessage.senderName}: ${messageText}` : messageText;
        }

        return { success: true, deletedMessage };
      }
    }
    return { success: false, error: "Message not found" };
  }

  getMessageById(chatId, messageId) {
    const chat = this.conversations.find(c => c.id === chatId);
    if (chat) {
      return chat.messages.find(m => m.id === messageId);
    }
    return null;
  }

  editMessage(chatId, messageId, newText) {
    const chat = this.conversations.find(c => c.id === chatId);
    if (chat) {
      const message = chat.messages.find(m => m.id === messageId);
      if (message) {
        message.text = newText;
        message.edited = true;
        message.editedAt = Date.now();

        // Update last message if this was the latest message
        const isLastMessage = chat.messages[chat.messages.length - 1].id === messageId;
        if (isLastMessage) {
          chat.lastMessage = message.media ? (newText || "📎 مرفق") : newText;
        }

        return { success: true, message };
      }
    }
    return { success: false, error: "Message not found" };
  }
}

export default new ConversationStore();