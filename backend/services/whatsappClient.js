import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import contactCache from './contactCache.js';

const { Client, LocalAuth, MessageMedia } = pkg;

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isClientReady = false;
    this.io = null;
  }

  initialize(io) {
    this.io = io;

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: "./session" }),
      puppeteer: { headless: false, args: ["--no-sandbox"] },
    });

    this.setupEventListeners();
    this.client.initialize();
  }

  setupEventListeners() {
    this.client.on("qr", (qr) => {
      console.log("📌 Scan this QR code:");
      qrcode.generate(qr, { small: true });
      this.io?.emit("qrCode", qr);
    });

    this.client.on("ready", async () => {
      console.log("✅ WhatsApp جاهز");
      this.isClientReady = true;
      this.io?.emit("clientReady", true);

      // Initialize contact cache in background for faster message processing
      setTimeout(async () => {
        await contactCache.initialize(this);
      }, 2000); // Wait 2 seconds after WhatsApp is ready

      await new Promise((r) => setTimeout(r, 3000));
    });

    this.client.on("disconnected", (reason) => {
      console.log("🔴 WhatsApp disconnected:", reason);
      this.isClientReady = false;
      this.io?.emit("clientDisconnected", reason);
    });
  }

  async sendMessage(chatId, message, media = null) {
    if (!this.isClientReady) {
      throw new Error("Client not ready");
    }

    if (media) {
      const messageMedia = new MessageMedia(
        media.mimetype,
        media.data,
        media.filename
      );
      return await this.client.sendMessage(chatId, messageMedia, { caption: message });
    } else {
      return await this.client.sendMessage(chatId, message);
    }
  }

  async getChats() {
    if (!this.isClientReady) {
      throw new Error("Client not ready");
    }
    return await this.client.getChats();
  }

  async getChatById(chatId) {
    if (!this.isClientReady) {
      throw new Error("Client not ready");
    }
    return await this.client.getChatById(chatId);
  }

  async getContactById(contactId) {
    if (!this.isClientReady) {
      throw new Error("Client not ready");
    }
    return await this.client.getContactById(contactId);
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isClientReady;
  }
}

export default new WhatsAppService();