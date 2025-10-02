import express from 'express';
import whatsappClient from '../services/whatsappClient.js';
import conversationStore from '../services/conversationStore.js';
import chatCache from '../services/chatCache.js';
import campaignManager from '../services/campaignManager.js';
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

// API: إرسال الرسائل (حملات) - Updated with campaign management
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

    const numbers = Array.isArray(rawNumbers) ? rawNumbers : [rawNumbers];
    const groups = Array.isArray(rawGroups) ? rawGroups : [rawGroups];

    // Start new campaign
    const campaignData = {
      message,
      numbers: numbers.filter(n => n),
      groups: groups.filter(g => g),
      delayMin,
      delayMax,
      files: req.files
    };

    const campaignId = campaignManager.startCampaign(campaignData);

    // Start campaign execution in background
    processCampaign(campaignId, req.io);

    res.json({
      success: true,
      campaignId,
      message: "Campaign started successfully"
    });
  } catch (err) {
    console.error("⛔ Send Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Process campaign in background with pause support
async function processCampaign(campaignId, io) {
  const campaign = campaignManager.getCampaign(campaignId);
  if (!campaign) return;

  const { message, numbers, groups, delayMin, delayMax, files } = campaign.data;
  const allTargets = [
    ...numbers.map(n => ({ id: n, type: 'individual' })),
    ...groups.map(g => ({ id: g, type: 'group' }))
  ];

  for (let i = campaign.currentIndex; i < allTargets.length; i++) {
    // Check if campaign is paused or stopped
    const currentCampaign = campaignManager.getCampaign(campaignId);
    if (!currentCampaign || currentCampaign.status === 'stopped') {
      console.log(`🛑 Campaign ${campaignId} stopped`);
      return;
    }

    if (currentCampaign.status === 'paused') {
      console.log(`⏸️ Campaign ${campaignId} paused at index ${i}`);
      campaignManager.updateCampaignProgress(campaignId, i);

      // Wait for resume
      while (true) {
        await delay(1000);
        const checkCampaign = campaignManager.getCampaign(campaignId);
        if (!checkCampaign || checkCampaign.status === 'stopped') {
          console.log(`🛑 Campaign ${campaignId} stopped during pause`);
          return;
        }
        if (checkCampaign.status === 'running') {
          console.log(`▶️ Campaign ${campaignId} resumed from index ${i}`);
          break;
        }
        // Continue waiting if still paused
      }
    }

    const target = allTargets[i];
    let result = {
      target: target.id,
      type: target.type,
      status: "فشل",
      time: getTime(),
      success: false
    };

    try {
      const chatId = target.type === 'individual'
        ? (target.id.includes("@c.us") ? target.id : `${target.id}@c.us`)
        : target.id;

      console.log(`📤 Sending to ${target.type}: ${chatId}`);

      if (files && files.image) {
        let filename = files.image.name;
        if (filename && Buffer.isBuffer(filename)) {
          filename = filename.toString('utf8');
        }

        const media = new MessageMedia(
          files.image.mimetype,
          files.image.data.toString("base64"),
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

      result = {
        target: target.id,
        type: target.type,
        status: "تم الإرسال",
        time: getTime(),
        success: true
      };

      console.log(`✅ Sent to ${chatId}`);
    } catch (err) {
      console.error(`⛔ Send Error for ${target.id}:`, err.message);
      result.error = err.message;
    }

    // Update campaign progress
    campaignManager.updateCampaignProgress(campaignId, i + 1, result);

    // Get updated campaign for results
    const updatedCampaign = campaignManager.getCampaign(campaignId);

    // Emit progress update
    io?.emit("campaignProgress", {
      campaignId,
      currentIndex: i + 1,
      total: allTargets.length,
      result,
      results: updatedCampaign?.results || []
    });

    // Random delay between messages
    if (i < allTargets.length - 1) {
      const randomDelay = getRandomDelay(delayMin, delayMax);
      await delay(randomDelay);
    }
  }

  // Mark campaign as completed
  campaignManager.completeCampaign(campaignId);
  const finalCampaign = campaignManager.getCampaign(campaignId);
  io?.emit("campaignCompleted", {
    campaignId,
    results: finalCampaign?.results || []
  });

  console.log(`🎉 Campaign ${campaignId} completed`);
}

// API: Pause campaign
router.post("/campaign/:id/pause", async (req, res) => {
  try {
    console.log("🔍 Backend: Received pause request for campaign:", req.params.id);
    const campaignId = parseInt(req.params.id);
    console.log("🔍 Backend: Parsed campaign ID:", campaignId);

    const success = campaignManager.pauseCampaign(campaignId);
    console.log("🔍 Backend: Pause result:", success);

    if (success) {
      console.log("📡 Backend: Emitting campaignPaused event for campaign:", campaignId);
      req.io?.emit("campaignPaused", { campaignId });
      res.json({ success: true, message: "Campaign paused successfully" });
    } else {
      console.log("❌ Backend: Failed to pause campaign");
      res.status(404).json({ success: false, error: "Campaign not found or already paused/stopped" });
    }
  } catch (err) {
    console.error("⛔ Pause campaign error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Resume campaign
router.post("/campaign/:id/resume", async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const success = campaignManager.resumeCampaign(campaignId);

    if (success) {
      req.io?.emit("campaignResumed", { campaignId });
      res.json({ success: true, message: "Campaign resumed successfully" });
    } else {
      res.status(404).json({ success: false, error: "Campaign not found or not paused" });
    }
  } catch (err) {
    console.error("⛔ Resume campaign error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Stop campaign
router.post("/campaign/:id/stop", async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const success = campaignManager.stopCampaign(campaignId);

    if (success) {
      req.io?.emit("campaignStopped", { campaignId });
      res.json({ success: true, message: "Campaign stopped successfully" });
    } else {
      res.status(404).json({ success: false, error: "Campaign not found" });
    }
  } catch (err) {
    console.error("⛔ Stop campaign error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get campaign status
router.get("/campaign/:id/status", async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const campaign = campaignManager.getCampaign(campaignId);

    if (campaign) {
      res.json({
        success: true,
        campaign: {
          id: campaign.id,
          status: campaign.status,
          currentIndex: campaign.currentIndex,
          totalTargets: campaign.data.numbers.length + campaign.data.groups.length,
          results: campaign.results,
          createdAt: campaign.createdAt,
          pausedAt: campaign.pausedAt
        }
      });
    } else {
      res.status(404).json({ success: false, error: "Campaign not found" });
    }
  } catch (err) {
    console.error("⛔ Get campaign status error:", err.message);
    res.status(500).json({ success: false, error: err.message });
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

        // Get the target chat object
        const targetChat = await chatCache.getChat(whatsappClient, targetChatId);

        // Forward via WhatsApp
        if (originalMessage.media && originalMessage.media.data && !originalMessage.media.error) {
          try {
            // Get base64 data
            let base64Data = originalMessage.media.data;

            // Remove data URL prefix if present (data:image/jpeg;base64,...)
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1];
            }

            // Sanitize base64 string
            // 1. Remove all whitespace, newlines, and tabs
            base64Data = base64Data.replace(/[\s\n\r\t]/g, '');

            // 2. Remove any non-base64 characters (keep only A-Z, a-z, 0-9, +, /, =)
            base64Data = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');

            // 3. Fix padding - base64 length should be multiple of 4
            const paddingNeeded = (4 - (base64Data.length % 4)) % 4;
            if (paddingNeeded > 0) {
              base64Data += '='.repeat(paddingNeeded);
            }

            // Validate that we have mimetype and data
            if (!originalMessage.media.mimetype || !base64Data || base64Data.length < 10) {
              throw new Error('Missing or invalid mimetype/data');
            }

            // Test decode to ensure validity
            try {
              Buffer.from(base64Data, 'base64');
            } catch (decodeError) {
              throw new Error(`Invalid base64: ${decodeError.message}`);
            }

            // Create MessageMedia object
            const mediaData = new MessageMedia(
              originalMessage.media.mimetype,
              base64Data,
              originalMessage.media.filename || 'attachment'
            );

            // Send media with or without caption using chat.sendMessage (like reply endpoint)
            if (forwardedText.trim()) {
              await targetChat.sendMessage(mediaData, { caption: forwardedText });
            } else {
              await targetChat.sendMessage(mediaData);
            }

            console.log(`✅ Media forwarded successfully to ${targetChatId}`);
          } catch (mediaError) {
            console.error(`⛔ Media forward error for ${targetChatId}:`, mediaError.message);
            console.error(`⛔ Media details:`, {
              hasMimetype: !!originalMessage.media.mimetype,
              hasData: !!originalMessage.media.data,
              dataLength: originalMessage.media.data?.length || 0,
              dataPreview: originalMessage.media.data?.substring(0, 100),
              filename: originalMessage.media.filename
            });
            // Fallback: send only text if media fails
            await targetChat.sendMessage(forwardedText + '\n\n[تعذر إرسال المرفق]');
          }
        } else {
          // Forward text only
          await targetChat.sendMessage(forwardedText);
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