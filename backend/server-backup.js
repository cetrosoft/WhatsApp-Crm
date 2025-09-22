import express from "express";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import cors from "cors";
import fileUpload from "express-fileupload";
import { Server } from "socket.io";
import { createServer } from "http";

const { Client, LocalAuth, MessageMedia } = pkg;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // في الإنتاج ضع الدومين الصحيح
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(fileUpload());

let isClientReady = false;

// 🗂️ Store الرسائل في الذاكرة
let conversations = [];

// Helper لإضافة رسالة واردة
function addIncomingMessage(from, name, message, isGroup = false, media = null) {
  let chat = conversations.find((c) => c.id === from);
  if (!chat) {
    chat = {
      id: from,
      name: name || from,
      number: isGroup ? null : from.split("@")[0],
      isGroup,
      messages: [],
      unread: 0,
    };
    conversations.push(chat);
  }
  
  const messageText = media ? (message || "📎 مرفق") : message;
  chat.lastMessage = messageText;
  
  const messageObj = {
    sender: from,
    text: message,
    time: new Date().toLocaleTimeString("ar-EG", { hour12: false }),
    media: media, // إضافة معلومات الميديا
    type: media ? 'media' : 'text' // نوع الرسالة
  };
  
  chat.messages.push(messageObj);
  
  // زيادة عداد الرسائل غير المقروءة
  chat.unread = (chat.unread || 0) + 1;

  // 📡 إرسال الرسالة الجديدة فوراً للفرونت اند
  io.emit("newMessage", {
    chatId: from,
    chatName: name,
    message: messageText,
    isGroup: isGroup,
    media: media,
    conversations: conversations // إرسال كل المحادثات محدثة
  });

  console.log(`📩 New message from ${name}: ${media ? '📎 Media' : message}`);
}

// Helper لإضافة رسالة صادرة
function addOutgoingMessage(to, message, media = null) {
  let chat = conversations.find((c) => c.id === to);
  if (chat) {
    const messageText = media ? (message || "📎 مرفق") : message;
    
    const messageObj = {
      sender: "me",
      text: message,
      time: new Date().toLocaleTimeString("ar-EG", { hour12: false }),
      media: media,
      type: media ? 'media' : 'text'
    };
    
    chat.messages.push(messageObj);
    chat.lastMessage = messageText;

    // 📡 إرسال الرسالة المرسلة للفرونت اند
    io.emit("messageSent", {
      chatId: to,
      message: messageText,
      media: media,
      conversations: conversations
    });
  }
}

// WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./session" }),
  puppeteer: { headless: false, args: ["--no-sandbox"] },
});

client.on("qr", (qr) => {
  console.log("📌 Scan this QR code:");
  qrcode.generate(qr, { small: true });
  
  // 📡 إرسال QR للفرونت اند
  io.emit("qrCode", qr);
});

client.on("ready", async () => {
  console.log("✅ WhatsApp جاهز");
  isClientReady = true;
  
  // 📡 إعلام الفرونت اند أن الكلايت جاهز
  io.emit("clientReady", true);
  
  await new Promise((r) => setTimeout(r, 3000));
});

client.on("disconnected", (reason) => {
  console.log("🔴 WhatsApp disconnected:", reason);
  isClientReady = false;
  
  // 📡 إعلام الفرونت اند بانقطاع الاتصال
  io.emit("clientDisconnected", reason);
});

client.initialize();

// 📩 Event: استقبال الرسائل
client.on("message", async (msg) => {
  try {
    const chat = await msg.getChat();
    let mediaData = null;

    // 📎 فحص إذا كانت الرسالة تحتوي على ميديا
    if (msg.hasMedia) {
      try {
        console.log("📎 Processing media message...");
        const media = await msg.downloadMedia();
        
        if (media) {
          mediaData = {
            mimetype: media.mimetype,
            data: media.data, // base64 data
            filename: media.filename || `media_${Date.now()}.${media.mimetype?.split('/')[1] || 'jpg'}`,
            size: media.data ? Math.round((media.data.length * 3) / 4) : 0 // تقدير الحجم
          };
          console.log(`📎 Media downloaded: ${mediaData.mimetype}, size: ~${Math.round(mediaData.size/1024)}KB`);
        }
      } catch (mediaError) {
        console.error("⛔ Error downloading media:", mediaError.message);
        // إذا فشل تحميل الميديا، أرسل رسالة نصية تشير لوجود مرفق
        mediaData = {
          error: true,
          message: "فشل تحميل المرفق"
        };
      }
    }

    if (chat.isGroup) {
      // 👥 رسالة جروب
      const authorContact = await client.getContactById(msg.author);
      const authorName = authorContact.pushname || authorContact.number;

      const displayMessage = mediaData 
        ? `${authorName}: ${msg.body || '📎 مرفق'}`
        : `${authorName}: ${msg.body}`;

      addIncomingMessage(
        chat.id._serialized,   // id الجروب
        chat.name,             // اسم الجروب
        displayMessage,        // نوضح اسم الراسل + الرسالة
        true,
        mediaData
      );
    } else {
      // 👤 رسالة فردية
      const contact = await msg.getContact();
      const name = contact.pushname || contact.number;

      addIncomingMessage(
        msg.from, 
        name, 
        msg.body || (mediaData ? '📎 مرفق' : ''), 
        false,
        mediaData
      );
    }
  } catch (err) {
    console.error("⛔ Error processing incoming message:", err.message);
  }
});

// 🔌 Socket.io Connections
io.on("connection", (socket) => {
  console.log("🔗 Client connected:", socket.id);

  // إرسال حالة الكلايت عند الاتصال
  socket.emit("clientStatus", {
    isReady: isClientReady,
    conversations: conversations
  });

  // عند قراءة المحادثة (تصفير العداد)
  socket.on("markAsRead", (chatId) => {
    const chat = conversations.find(c => c.id === chatId);
    if (chat) {
      chat.unread = 0;
      // إرسال المحادثات المحدثة للجميع
      io.emit("conversationsUpdated", conversations);
    }
  });

  // عند انقطاع الاتصال
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// API: Inbox - جلب المحادثات
app.get("/inbox", (req, res) => {
  res.json(conversations);
});

// API: Reply - الرد على محادثة (فرد / جروب)
app.post("/reply", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  let chatId = to;
  if (!chatId.includes("@c.us") && !chatId.includes("@g.us")) {
    chatId = `${chatId}@c.us`;
  }

  console.log("📤 Trying to send reply to:", chatId, "message:", message);

  try {
    const chats = await client.getChats();
    const chat = chats.find((c) => c.id._serialized === chatId);

    if (chat) {
      await chat.sendMessage(message);
      console.log("✅ Sent via chats.find → chat.sendMessage");
      addOutgoingMessage(chatId, message);
      return res.json({ success: true });
    }

    // تجربة getChatById
    try {
      const chatById = await client.getChatById(chatId);
      await chatById.sendMessage(message);
      console.log("✅ Sent via getChatById → chat.sendMessage");
      addOutgoingMessage(chatId, message);
      return res.json({ success: true });
    } catch (innerErr) {
      console.error("⚠️ getChatById failed:", innerErr);
    }

    // Fallback client.sendMessage
    await client.sendMessage(chatId, message);
    console.log("✅ Sent via client.sendMessage (fallback)");
    addOutgoingMessage(chatId, message);
    return res.json({ success: true });

  } catch (err) {
    console.error("⛔ Reply error FULL object:", err);
    console.error("⛔ Reply error stack:", err.stack);
    res.status(500).json({ success: false, error: err.message || err.toString() });
  }
});

// API: الجروبات فقط
app.get("/groups", async (req, res) => {
  try {
    const chats = await client.getChats();
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
app.get("/all-chats", async (req, res) => {
  try {
    if (!client || !client.getChats) {
      console.error("⚠️ WhatsApp client not ready");
      return res.status(200).json([]);
    }

    const chats = await client.getChats();
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

// Delay helper
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// API: إرسال الرسائل (حملات)
app.post("/send", async (req, res) => {
  try {
    if (!isClientReady) {
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

    function getTime() {
      return new Date().toLocaleTimeString("ar-EG", { hour12: false });
    }

    // إرسال للأفراد
    for (let n of numbers) {
      if (!n) continue;
      try {
        const chatId = n.includes("@c.us") ? n : `${n}@c.us`;
        console.log(`📤 Sending to individual: ${chatId}`);
        if (req.files && req.files.image) {
          const media = new MessageMedia(
            req.files.image.mimetype,
            req.files.image.data.toString("base64"),
            req.files.image.name
          );
          await client.sendMessage(chatId, media, { caption: message });
        } else {
          await client.sendMessage(chatId, message);
        }
        results.push({
          target: n,
          type: "individual",
          status: "تم الإرسال",
          time: getTime(),
        });
        console.log(`✅ Sent to ${chatId}`);

        const randomDelay =
          Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
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
          const media = new MessageMedia(
            req.files.image.mimetype,
            req.files.image.data.toString("base64"),
            req.files.image.name
          );
          await client.sendMessage(g, media, { caption: message });
        } else {
          await client.sendMessage(g, message);
        }
        results.push({
          target: g,
          type: "group",
          status: "تم الإرسال",
          time: getTime(),
        });
        console.log(`✅ Sent to group ${g}`);

        const randomDelay =
          Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
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

server.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);