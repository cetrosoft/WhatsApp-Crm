class ChatCache {
  constructor() {
    this.chatCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  async getChat(whatsappClient, chatId) {
    const now = Date.now();

    // Check if we have a cached chat that's still valid
    if (this.chatCache.has(chatId)) {
      const cachedChat = this.chatCache.get(chatId);
      if (now - cachedChat.timestamp < this.cacheTimeout) {
        return cachedChat.chat;
      }
    }

    try {
      // Try direct getChatById first (most efficient)
      const chat = await whatsappClient.getChatById(chatId);

      // Cache the chat
      this.chatCache.set(chatId, {
        chat: chat,
        timestamp: now
      });

      return chat;
    } catch (error) {
      console.log(`Chat not found with getChatById: ${chatId}, trying getChats...`);

      // Fallback to searching all chats (less efficient)
      const chats = await whatsappClient.getChats();
      const chat = chats.find((c) => c.id._serialized === chatId);

      if (chat) {
        // Cache the found chat
        this.chatCache.set(chatId, {
          chat: chat,
          timestamp: now
        });
        return chat;
      }

      throw new Error(`Chat not found: ${chatId}`);
    }
  }

  clearCache() {
    this.chatCache.clear();
  }

  cleanExpiredCache() {
    const now = Date.now();
    for (const [chatId, cachedData] of this.chatCache.entries()) {
      if (now - cachedData.timestamp >= this.cacheTimeout) {
        this.chatCache.delete(chatId);
      }
    }
  }

  getCacheStats() {
    return {
      size: this.chatCache.size,
      lastUpdate: this.lastCacheUpdate
    };
  }
}

export default new ChatCache();