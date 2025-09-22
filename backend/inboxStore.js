// inboxStore.js

// مصفوفة لتخزين المحادثات
let conversations = [];

/**
 * إضافة رسالة واردة
 */
function addIncomingMessage(from, name, message, isGroup = false) {
  let chat = conversations.find((c) => c.id === from);
  if (!chat) {
    chat = {
      id: from,
      name: name || from,
      number: isGroup ? null : from.split("@")[0],
      isGroup,
      messages: [],
    };
    conversations.push(chat);
  }

  chat.lastMessage = message;
  chat.messages.push({
    sender: from,
    text: message,
    time: new Date().toLocaleTimeString(),
  });
}

/**
 * إضافة رسالة صادرة
 */
function addOutgoingMessage(to, message) {
  let chat = conversations.find((c) => c.id === to);
  if (chat) {
    chat.messages.push({
      sender: "me",
      text: message,
      time: new Date().toLocaleTimeString(),
    });
    chat.lastMessage = message;
  }
}

/**
 * استرجاع كل المحادثات
 */
function getConversations() {
  return conversations;
}

module.exports = {
  addIncomingMessage,
  addOutgoingMessage,
  getConversations,
};
