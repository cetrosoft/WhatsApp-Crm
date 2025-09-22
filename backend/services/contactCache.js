class ContactCache {
  constructor() {
    this.contacts = new Map();
    this.isLoaded = false;
    this.loading = false;
  }

  async initialize(whatsappClient) {
    if (this.loading || this.isLoaded) return;

    this.loading = true;
    console.log("📇 Initializing contact cache...");

    try {
      const startTime = Date.now();
      const allContacts = await whatsappClient.getContacts();

      // Build contact map for fast lookups
      allContacts.forEach(contact => {
        this.contacts.set(contact.id._serialized, {
          name: contact.name || contact.pushname || contact.formattedName,
          number: contact.number,
          id: contact.id._serialized
        });
      });

      this.isLoaded = true;
      const loadTime = Date.now() - startTime;
      console.log(`✅ Contact cache loaded: ${this.contacts.size} contacts in ${loadTime}ms`);
    } catch (err) {
      console.error("⛔ Failed to initialize contact cache:", err.message);
    } finally {
      this.loading = false;
    }
  }

  getContact(contactId) {
    return this.contacts.get(contactId);
  }

  getContactName(contactId) {
    const contact = this.contacts.get(contactId);
    return contact ? contact.name : null;
  }

  // Add or update a contact in cache
  setContact(contactId, contactData) {
    this.contacts.set(contactId, contactData);
  }

  isReady() {
    return this.isLoaded;
  }

  getCacheStats() {
    return {
      size: this.contacts.size,
      isLoaded: this.isLoaded,
      loading: this.loading
    };
  }

  // Refresh cache (for periodic updates)
  async refresh(whatsappClient) {
    this.isLoaded = false;
    await this.initialize(whatsappClient);
  }
}

export default new ContactCache();