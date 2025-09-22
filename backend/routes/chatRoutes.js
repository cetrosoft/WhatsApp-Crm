import express from 'express';
import whatsappClient from '../services/whatsappClient.js';
import conversationStore from '../services/conversationStore.js';
import contactCache from '../services/contactCache.js';

// Cache for group members (expires after 5 minutes)
const groupMembersCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const router = express.Router();

// API: Inbox - جلب المحادثات
router.get("/inbox", (req, res) => {
  res.json(conversationStore.getConversations());
});

// API: الجروبات فقط
router.get("/groups", async (req, res) => {
  try {
    const chats = await whatsappClient.getChats();
    const groups = chats
      .filter((c) => c.isGroup)
      .map((g) => ({ id: g.id._serialized, name: g.name }));
    res.json(groups);
  } catch (err) {
    console.error("⛔ Error fetching groups:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: كل المحادثات (أفراد + جروبات)
router.get("/all-chats", async (req, res) => {
  try {
    if (!whatsappClient.isReady()) {
      console.error("⚠️ WhatsApp client not ready");
      return res.status(200).json([]);
    }

    const chats = await whatsappClient.getChats();
    const allChats = chats.map((c) => ({
      name: c.name || c.formattedTitle || c.id.user,
      id: c.id._serialized,
      isGroup: c.isGroup,
    }));

    res.json(allChats);
  } catch (err) {
    console.error("⛔ Error fetching chats:", err.message);
    res.status(200).json([]);
  }
});

// API: أعضاء المجموعة
router.get("/group-members/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!whatsappClient.isReady()) {
      console.error("⚠️ WhatsApp client not ready");
      return res.status(500).json({ error: "WhatsApp client not ready" });
    }

    // Check cache first
    const cacheKey = groupId;
    const cached = groupMembersCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
      console.log("📋 Returning cached group members for", groupId);
      return res.json(cached.data);
    }

    const chat = await whatsappClient.getChatById(groupId);

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Get group participants
    const participants = await chat.participants;

    // Process participants using contact cache for fast lookup
    const members = participants.map(participant => {
      let name = null;

      // First try to get name from contact cache (fastest)
      if (contactCache.isReady()) {
        name = contactCache.getContactName(participant.id._serialized);
      }

      // If no name from cache, try participant contact data
      if (!name && participant.contact) {
        name = participant.contact.name || participant.contact.pushname;
      }

      // If still no name, use fallback (phone number will be shown)
      if (!name) {
        console.log(`No cached contact info for ${participant.id.user}`);
      }

      return {
        id: participant.id._serialized,
        number: participant.id.user,
        name: name,
        isAdmin: participant.isAdmin || false,
        isSuperAdmin: participant.isSuperAdmin || false
      };
    });

    const responseData = {
      groupId: chat.id._serialized,
      groupName: chat.name,
      memberCount: members.length,
      members: members
    };

    // Cache the result
    groupMembersCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Debug: Log members with/without names
    const membersWithNames = members.filter(m => m.name).length;
    console.log(`✅ Fetched ${members.length} group members for ${chat.name} (${membersWithNames} with names)`);

    res.json(responseData);

  } catch (err) {
    console.error("⛔ Error fetching group members:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;