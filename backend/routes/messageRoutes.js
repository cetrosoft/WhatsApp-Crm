import express from 'express';
import whatsappClient from '../services/whatsappClient.js';
import conversationStore from '../services/conversationStore.js';
import chatCache from '../services/chatCache.js';
import { delay, getRandomDelay, getTime } from '../utils/delay.js';
import pkg from "whatsapp-web.js";
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const { MessageMedia } = pkg;
const router = express.Router();

// API: Reply - الرد على محادثة (فرد / جروب)
router.post("/reply", async (req, res) => {
  const { to, message } = req.body;
  if (!to || (!message && !req.files)) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  let chatId = to;
  if (!chatId.includes("@c.us") && !chatId.includes("@g.us")) {
    chatId = `${chatId}@c.us`;
  }

  console.log("📤 Sending reply to:", chatId);

  try {
    // Use cached chat lookup for better performance
    const chat = await chatCache.getChat(whatsappClient, chatId);

    let mediaData = null;

    // Handle file attachment
    if (req.files && req.files.file) {
      const file = req.files.file;

      // Preserve Arabic filename properly
      let filename = file.name;
      if (filename && Buffer.isBuffer(filename)) {
        filename = filename.toString('utf8');
      }

      console.log(`📎 Processing uploaded file: ${filename} (${file.mimetype})`);

      mediaData = new MessageMedia(
        file.mimetype,
        file.data.toString('base64'),
        filename
      );

      // Also store the media data for our conversation store
      mediaData.filename = filename;
      mediaData.size = file.size;
    }

    // Send message using cached chat
    if (mediaData && message) {
      // Send media with caption
      await chat.sendMessage(mediaData, { caption: message });
    } else if (mediaData) {
      // Send media only
      await chat.sendMessage(mediaData);
    } else {
      // Send text only
      await chat.sendMessage(message);
    }

    // Process conversation store update
    const result = conversationStore.addOutgoingMessage(chatId, message || "📎 مرفق", mediaData);

    // Send optimized socket update with minimal data
    const updatedConversations = conversationStore.getConversations();
    const updatedChat = updatedConversations.find(c => c.id === chatId);

    req.io?.emit("messageSent", {
      chatId: chatId,
      message: result?.messageText,
      media: result?.media,
      conversations: updatedConversations // Keep for now, can be optimized further
    });

    // Also emit targeted chat update for better performance
    req.io?.emit("chatUpdated", {
      chatId: chatId,
      chat: updatedChat
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("⛔ Reply error FULL object:", err);
    console.error("⛔ Reply error stack:", err.stack);
    res.status(500).json({ success: false, error: err.message || err.toString() });
  }
});

// API: إرسال الرسائل (حملات)
router.post("/send", async (req, res) => {
  try {
    if (!whatsappClient.isReady()) {
      return res.status(500).json({ error: "Client not ready yet" });
    }

    const message = req.body.message || "";
    const rawNumbers = req.body["numbers[]"] || [];
    const rawGroups = req.body["groups[]"] || [];

    const delayMin = parseInt(req.body.delayMin) || 2000;
    const delayMax = parseInt(req.body.delayMax) || 5000;

    let results = [];
    const numbers = Array.isArray(rawNumbers) ? rawNumbers : [rawNumbers];
    const groups = Array.isArray(rawGroups) ? rawGroups : [rawGroups];

    // إرسال للأفراد
    for (let n of numbers) {
      if (!n) continue;
      try {
        const chatId = n.includes("@c.us") ? n : `${n}@c.us`;
        console.log(`📤 Sending to individual: ${chatId}`);

        if (req.files && req.files.image) {
          // Preserve Arabic filename properly
          let filename = req.files.image.name;
          if (filename && Buffer.isBuffer(filename)) {
            filename = filename.toString('utf8');
          }

          const media = new MessageMedia(
            req.files.image.mimetype,
            req.files.image.data.toString("base64"),
            filename
          );
          await whatsappClient.sendMessage(chatId, message, {
            mimetype: media.mimetype,
            data: media.data,
            filename: media.filename
          });
        } else {
          await whatsappClient.sendMessage(chatId, message);
        }

        results.push({
          target: n,
          type: "individual",
          status: "تم الإرسال",
          time: getTime(),
        });
        console.log(`✅ Sent to ${chatId}`);

        const randomDelay = getRandomDelay(delayMin, delayMax);
        await delay(randomDelay);
      } catch (err) {
        console.error(`⛔ Send Error for ${n}:`, err.message);
        results.push({ target: n, type: "individual", status: "فشل" });
      }
    }

    // إرسال للجروبات
    for (let g of groups) {
      if (!g) continue;
      try {
        console.log(`📤 Sending to group: ${g}`);

        if (req.files && req.files.image) {
          // Preserve Arabic filename properly
          let filename = req.files.image.name;
          if (filename && Buffer.isBuffer(filename)) {
            filename = filename.toString('utf8');
          }

          const media = new MessageMedia(
            req.files.image.mimetype,
            req.files.image.data.toString("base64"),
            filename
          );
          await whatsappClient.sendMessage(g, message, {
            mimetype: media.mimetype,
            data: media.data,
            filename: media.filename
          });
        } else {
          await whatsappClient.sendMessage(g, message);
        }

        results.push({
          target: g,
          type: "group",
          status: "تم الإرسال",
          time: getTime(),
        });
        console.log(`✅ Sent to group ${g}`);

        const randomDelay = getRandomDelay(delayMin, delayMax);
        await delay(randomDelay);
      } catch (err) {
        console.error(`⛔ Send Error for ${g}:`, err.message);
        results.push({ target: g, type: "group", status: "فشل", time: getTime() });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error("⛔ Send Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Delete message
router.delete("/message", async (req, res) => {
  try {
    const { chatId, messageId, deleteType } = req.body;

    if (!chatId || !messageId || !deleteType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: chatId, messageId, deleteType"
      });
    }

    // Delete from local conversation store
    const result = conversationStore.deleteMessage(chatId, messageId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    // If deleteType is 'deleteForEveryone', we could implement WhatsApp deletion here
    // For now, we just delete from our local store

    // Emit real-time update to all clients
    req.io?.emit("messageDeleted", {
      chatId: chatId,
      messageId: messageId,
      deleteType: deleteType,
      conversations: conversationStore.getConversations()
    });

    res.json({
      success: true,
      message: "Message deleted successfully"
    });

  } catch (err) {
    console.error("⛔ Delete message error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// API: Forward message
router.post("/forward", async (req, res) => {
  try {
    const { messageId, chatId, targetChats } = req.body;

    if (!messageId || !chatId || !targetChats || !Array.isArray(targetChats)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: messageId, chatId, targetChats"
      });
    }

    // Get the original message
    const originalMessage = conversationStore.getMessageById(chatId, messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        error: "Original message not found"
      });
    }

    let results = [];

    // Forward to each target chat
    for (const targetChatId of targetChats) {
      try {
        let forwardedText = originalMessage.text;

        // Add forwarded indicator if it's not already forwarded
        if (!forwardedText?.startsWith('🔄 رسالة محولة')) {
          forwardedText = `🔄 رسالة محولة\n\n${forwardedText || ''}`;
        }

        // Forward via WhatsApp
        if (originalMessage.media && originalMessage.media.data) {
          try {
            // Validate base64 data before creating MessageMedia
            let base64Data = originalMessage.media.data;

            // Remove data URL prefix if present (data:image/jpeg;base64,...)
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1];
            }

            // Validate base64 format
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (!base64Regex.test(base64Data)) {
              throw new Error('Invalid base64 format');
            }

            // Test decode to ensure it's valid
            Buffer.from(base64Data, 'base64');

            const mediaData = new MessageMedia(
              originalMessage.media.mimetype,
              base64Data,
              originalMessage.media.filename
            );

            if (forwardedText.trim()) {
              await whatsappClient.sendMessage(targetChatId, mediaData, { caption: forwardedText });
            } else {
              await whatsappClient.sendMessage(targetChatId, mediaData);
            }
          } catch (mediaError) {
            console.error(`⛔ Media forward error for ${targetChatId}:`, mediaError.message);
            // Fallback: send only text if media fails
            await whatsappClient.sendMessage(targetChatId, forwardedText + '\n\n[تعذر إرسال المرفق]');
          }
        } else {
          // Forward text only
          await whatsappClient.sendMessage(targetChatId, forwardedText);
        }

        // Add to conversation store
        conversationStore.addOutgoingMessage(targetChatId, forwardedText, originalMessage.media);

        results.push({
          targetChatId,
          status: "تم الإرسال",
          success: true
        });

        console.log(`✅ Message forwarded to ${targetChatId}`);

      } catch (err) {
        console.error(`⛔ Forward error for ${targetChatId}:`, err.message);
        results.push({
          targetChatId,
          status: "فشل الإرسال",
          success: false,
          error: err.message
        });
      }
    }

    // Emit real-time update
    req.io?.emit("messageForwarded", {
      originalChatId: chatId,
      messageId: messageId,
      results: results,
      conversations: conversationStore.getConversations()
    });

    res.json({
      success: true,
      results: results,
      message: `Message forwarded to ${results.filter(r => r.success).length} out of ${targetChats.length} chats`
    });

  } catch (err) {
    console.error("⛔ Forward message error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// API: URL Preview - Extract metadata from URLs
router.post("/url-preview", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required"
      });
    }

    // Validate URL format
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format"
      });
    }

    // Fetch the webpage
    const response = await fetch(targetUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000, // 10 second timeout
      follow: 5 // Follow up to 5 redirects
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const metadata = {
      url: targetUrl.href,
      domain: targetUrl.hostname,
      title: null,
      description: null,
      image: null
    };

    // Extract title
    metadata.title = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('title').text() ||
                    null;

    // Extract description
    metadata.description = $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="twitter:description"]').attr('content') ||
                          $('meta[name="description"]').attr('content') ||
                          null;

    // Extract image
    let imageUrl = $('meta[property="og:image"]').attr('content') ||
                   $('meta[name="twitter:image"]').attr('content') ||
                   null;

    // Convert relative image URLs to absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('//')) {
        imageUrl = targetUrl.protocol + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        imageUrl = targetUrl.origin + imageUrl;
      } else {
        imageUrl = targetUrl.origin + '/' + imageUrl;
      }
    }

    metadata.image = imageUrl;

    // Clean up metadata
    if (metadata.title) {
      metadata.title = metadata.title.trim().substring(0, 200);
    }
    if (metadata.description) {
      metadata.description = metadata.description.trim().substring(0, 300);
    }

    console.log(`✅ URL preview fetched for: ${targetUrl.hostname}`);

    res.json({
      success: true,
      ...metadata
    });

  } catch (err) {
    console.error("⛔ URL preview error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch URL preview"
    });
  }
});

// API: Edit message - Edit sent messages within time limit
router.put("/message", async (req, res) => {
  try {
    const { chatId, messageId, newText } = req.body;

    if (!chatId || !messageId || newText === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: chatId, messageId, newText"
      });
    }

    // Get the original message
    const originalMessage = conversationStore.getMessageById(chatId, messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        error: "Message not found"
      });
    }

    // Check if message is from current user
    if (originalMessage.sender !== "me") {
      return res.status(403).json({
        success: false,
        error: "Can only edit your own messages"
      });
    }

    // Check time limit (15 minutes = 900000 milliseconds)
    const timeLimit = 15 * 60 * 1000; // 15 minutes
    const currentTime = Date.now();
    const messageTime = originalMessage.timestamp;

    if (currentTime - messageTime > timeLimit) {
      return res.status(403).json({
        success: false,
        error: "Message can only be edited within 15 minutes of sending"
      });
    }

    // Update message in conversation store
    const result = conversationStore.editMessage(chatId, messageId, newText);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Emit real-time update to all clients
    if (req.io) {
      // Primary event for message editing
      req.io.emit("messageEdited", {
        chatId: chatId,
        messageId: messageId,
        newText: newText,
        editedAt: new Date().toISOString(),
        conversations: conversationStore.getConversations()
      });

      // Backup event for broader compatibility
      req.io.emit("conversationsUpdated", conversationStore.getConversations());

      console.log(`📡 Emitted messageEdited event to all clients for chat ${chatId}`);
    }

    console.log(`✅ Message edited in chat ${chatId}`);

    res.json({
      success: true,
      message: "Message edited successfully",
      editedText: newText
    });

  } catch (err) {
    console.error("⛔ Edit message error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;