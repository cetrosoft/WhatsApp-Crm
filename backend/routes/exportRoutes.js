import express from 'express';
import whatsappClient from '../services/whatsappClient.js';

const router = express.Router();

// Export contacts to CSV
router.get('/export-contacts', async (req, res) => {
  try {
    if (!whatsappClient.isReady()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp client not ready'
      });
    }

    const { type = 'all' } = req.query; // 'all', 'contacts', 'groups'
    const chats = await whatsappClient.getChats();

    let filteredChats = chats;
    if (type === 'contacts') {
      filteredChats = chats.filter(chat => !chat.isGroup);
    } else if (type === 'groups') {
      filteredChats = chats.filter(chat => chat.isGroup);
    }

    // Prepare CSV data
    const csvHeader = 'Name,Phone,Type,IsGroup,LastMessage,Timestamp\n';
    const csvData = filteredChats.map(chat => {
      const name = (chat.name || 'Unknown').replace(/,/g, ';'); // Replace commas to avoid CSV issues
      const phone = chat.id.user || '';
      const type = chat.isGroup ? 'Group' : 'Contact';
      const isGroup = chat.isGroup ? 'Yes' : 'No';
      const lastMessage = chat.lastMessage ? (chat.lastMessage.body || '').replace(/,/g, ';').substring(0, 100) : '';
      const timestamp = chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000).toISOString() : '';

      return `"${name}","${phone}","${type}","${isGroup}","${lastMessage}","${timestamp}"`;
    }).join('\n');

    const csvContent = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="whatsapp_${type}_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export contacts'
    });
  }
});

// Export campaign logs to CSV
router.get('/export-campaign-logs', async (req, res) => {
  try {
    // This would need to be stored in a database or session storage
    // For now, we'll return a sample structure
    const csvHeader = 'Recipient,Phone,Status,Message,Timestamp,Error\n';
    const csvData = '"Sample Contact","+1234567890","Success","Test message","2024-01-01T10:00:00Z",""\n';

    const csvContent = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaign_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting campaign logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export campaign logs'
    });
  }
});

// Import contacts from CSV
router.post('/import-contacts', async (req, res) => {
  try {
    if (!req.files || !req.files.csvFile) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    const csvFile = req.files.csvFile;
    const csvContent = csvFile.data.toString('utf8');

    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'CSV file must contain at least a header and one data row'
      });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const contacts = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

        if (values.length < 2) continue; // Skip invalid rows

        const contact = {
          name: values[0] || `Contact ${i}`,
          phone: values[1] || '',
          type: values[2] || 'Contact',
          isGroup: (values[3] || '').toLowerCase() === 'yes'
        };

        // Basic phone validation
        if (contact.phone && !/^\+?[\d\s\-\(\)]+$/.test(contact.phone)) {
          errors.push(`Row ${i + 1}: Invalid phone number format`);
          continue;
        }

        contacts.push(contact);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${contacts.length} contacts`,
      data: {
        contacts,
        imported: contacts.length,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    console.error('Error importing contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import contacts'
    });
  }
});

// Get import template CSV
router.get('/import-template', (req, res) => {
  const csvTemplate = 'Name,Phone,Type,IsGroup\n"John Doe","+1234567890","Contact","No"\n"Test Group","+0987654321","Group","Yes"\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts_import_template.csv"');
  res.send(csvTemplate);
});

export default router;