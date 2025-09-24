import express from 'express';
import whatsappClient from '../services/whatsappClient.js';

const router = express.Router();

// Get profile information
router.get('/profile', async (req, res) => {
  try {
    if (!whatsappClient.isReady()) {
      return res.json({
        success: false,
        connected: false,
        message: 'WhatsApp client not ready'
      });
    }

    const client = whatsappClient.getClient();
    const profileData = await whatsappClient.getProfileInfo();

    res.json({
      success: true,
      connected: true,
      profile: profileData
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.json({
      success: false,
      connected: whatsappClient.isReady(),
      message: 'Failed to get profile information'
    });
  }
});

// Connect to WhatsApp
router.post('/connect', async (req, res) => {
  try {
    if (whatsappClient.isReady()) {
      return res.json({
        success: true,
        message: 'Already connected'
      });
    }

    // If client exists but not ready, we need to reinitialize
    if (whatsappClient.getClient()) {
      await whatsappClient.getClient().destroy();
    }

    // Initialize new client
    whatsappClient.initialize(req.io);

    res.json({
      success: true,
      message: 'Connection initiated. Please scan QR code.'
    });
  } catch (error) {
    console.error('Error connecting:', error);
    res.json({
      success: false,
      message: 'Failed to initiate connection'
    });
  }
});

// Disconnect from WhatsApp
router.post('/disconnect', async (req, res) => {
  try {
    await whatsappClient.disconnect();

    res.json({
      success: true,
      message: 'Disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.json({
      success: false,
      message: 'Failed to disconnect'
    });
  }
});

export default router;