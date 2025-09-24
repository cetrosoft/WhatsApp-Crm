import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import contactCache from './contactCache.js';

const { Client, LocalAuth, MessageMedia } = pkg;

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isClientReady = false;
    this.io = null;
    this.profileData = null;
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

      // Load profile data
      try {
        this.profileData = await this.loadProfileInfo();
        this.io?.emit("profileLoaded", this.profileData);
      } catch (error) {
        console.error("Error loading profile:", error);
      }

      // Initialize contact cache in background for faster message processing
      setTimeout(async () => {
        await contactCache.initialize(this);
      }, 2000); // Wait 2 seconds after WhatsApp is ready

      await new Promise((r) => setTimeout(r, 3000));
    });

    this.client.on("disconnected", (reason) => {
      console.log("🔴 WhatsApp disconnected:", reason);
      this.isClientReady = false;
      this.profileData = null;
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

  async loadProfileInfo() {
    if (!this.isClientReady) {
      throw new Error("Client not ready");
    }

    try {
      // Get contact info (our own info)
      const contact = await this.client.getContactById(this.client.info.wid._serialized);

      let profilePic = null;
      try {
        profilePic = await this.client.getProfilePicUrl(this.client.info.wid._serialized);
      } catch (error) {
        console.log("No profile picture available");
      }

      this.profileData = {
        name: contact.name || contact.pushname || "غير محدد",
        number: this.client.info.wid.user,
        about: contact.statusMessage || null,
        profilePic: profilePic,
        isReady: true
      };

      return this.profileData;
    } catch (error) {
      console.error("Error loading profile info:", error);
      throw error;
    }
  }

  async getProfileInfo() {
    if (this.profileData && this.isClientReady) {
      return this.profileData;
    }

    if (this.isClientReady) {
      return await this.loadProfileInfo();
    }

    throw new Error("Client not ready");
  }

  getProfileData() {
    return this.profileData;
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.client = null;
      }
      this.isClientReady = false;
      this.profileData = null;

      if (this.io) {
        this.io.emit('clientDisconnected', 'Manual disconnection');
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
      throw error;
    }
  }
}

export default new WhatsAppService();