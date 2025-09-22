import whatsappClient from '../services/whatsappClient.js';
import conversationStore from '../services/conversationStore.js';
import contactCache from '../services/contactCache.js';

export async function processIncomingMessage(msg, io) {
  try {
    const chat = await msg.getChat();
    let mediaData = null;

    // Check for location message
    if (msg.location) {
      console.log("📍 Processing location message...");
      let locationText = `📍 الموقع الجغرافي\nLatitude: ${msg.location.latitude}\nLongitude: ${msg.location.longitude}`;
      if (msg.location.description) {
        locationText += `\nالوصف: ${msg.location.description}`;
      }
      // Add Google Maps link
      const mapsUrl = `https://www.google.com/maps?q=${msg.location.latitude},${msg.location.longitude}`;
      locationText += `\n${mapsUrl}`;

      // Override the message body with formatted location
      msg.body = locationText;
    }

    if (msg.hasMedia) {
      try {
        console.log("📎 Processing media message...");
        const media = await msg.downloadMedia();

        if (media) {
          mediaData = {
            mimetype: media.mimetype,
            data: media.data,
            filename: media.filename || `media_${Date.now()}.${media.mimetype?.split('/')[1] || 'jpg'}`,
            size: media.data ? Math.round((media.data.length * 3) / 4) : 0
          };
          console.log(`📎 Media downloaded: ${mediaData.mimetype}, size: ~${Math.round(mediaData.size/1024)}KB`);
        }
      } catch (mediaError) {
        console.error("⛔ Error downloading media:", mediaError.message);
        mediaData = {
          error: true,
          message: "فشل تحميل المرفق"
        };
      }
    }

    if (chat.isGroup) {
      // Try to get author name from cache first, fallback to API call
      let authorName = contactCache.getContactName(msg.author);

      if (!authorName) {
        try {
          const authorContact = await whatsappClient.getContactById(msg.author);
          authorName = authorContact.pushname || authorContact.number;

          // Cache the contact for future use
          contactCache.setContact(msg.author, {
            name: authorName,
            number: authorContact.number,
            id: msg.author
          });
        } catch (err) {
          console.log(`Failed to get contact info for ${msg.author}, using ID`);
          authorName = msg.author.split('@')[0]; // Use phone number as fallback
        }
      }

      const messageBody = msg.body || (mediaData ? '📎 مرفق' : '');
      const displayMessage = `${authorName}: ${messageBody}`;

      const result = conversationStore.addIncomingMessage(
        chat.id._serialized,
        chat.name,
        messageBody, // Just the message content
        true,
        mediaData,
        authorName, // Pass sender name separately
        msg.timestamp * 1000 // Convert WhatsApp timestamp to milliseconds
      );

      io.emit("newMessage", {
        chatId: chat.id._serialized,
        chatName: chat.name,
        message: result.messageText,
        isGroup: true,
        media: mediaData,
        conversations: conversationStore.getConversations()
      });
    } else {
      // Try to get contact name from cache first
      let name = contactCache.getContactName(msg.from);

      if (!name) {
        try {
          const contact = await msg.getContact();
          name = contact.pushname || contact.number;

          // Cache the contact for future use
          contactCache.setContact(msg.from, {
            name: name,
            number: contact.number,
            id: msg.from
          });
        } catch (err) {
          console.log(`Failed to get contact info for ${msg.from}, using number`);
          name = msg.from.split('@')[0]; // Use phone number as fallback
        }
      }

      const result = conversationStore.addIncomingMessage(
        msg.from,
        name,
        msg.body || (mediaData ? '📎 مرفق' : ''),
        false,
        mediaData,
        null, // No sender name for individual chats
        msg.timestamp * 1000 // Convert WhatsApp timestamp to milliseconds
      );

      io.emit("newMessage", {
        chatId: msg.from,
        chatName: name,
        message: result.messageText,
        isGroup: false,
        media: mediaData,
        conversations: conversationStore.getConversations()
      });
    }

    console.log(`📩 New message from ${chat.isGroup ? chat.name : contact.pushname || contact.number}: ${mediaData ? '📎 Media' : msg.body}`);
  } catch (err) {
    console.error("⛔ Error processing incoming message:", err.message);
  }
}