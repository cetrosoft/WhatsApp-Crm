# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WhatsApp bulk messaging application with a Node.js backend and React frontend. The backend uses whatsapp-web.js to interface with WhatsApp Web, providing bulk messaging capabilities, real-time chat monitoring, and an inbox for managing conversations.

## Development Commands

### Backend (Port 5000)
```bash
cd backend
npm install
npm start
```

### Frontend (Development - Port 5173)
```bash
cd Frontend
npm install
npm run dev
```

### Frontend (Production Build)
```bash
cd Frontend
npm run build
npm run preview
```

## Architecture Overview

### Backend Architecture
- **Express.js server** on port 5000 with CORS enabled
- **WhatsApp-web.js integration** using LocalAuth strategy with session persistence in `./session`
- **Socket.io** for real-time communication between frontend and backend
- **In-memory storage** for conversations and messages (no database)
- **Puppeteer** running in non-headless mode for WhatsApp Web automation

### Key Backend Components
- `server.js` - Main server file with all API endpoints and Socket.io handlers
- `inboxStore.js` - Additional storage utilities (if needed)
- Session data stored in `./session/` directory for WhatsApp authentication

### Frontend Architecture
- **React 18** with Vite as build tool
- **TailwindCSS** for styling with Cairo font family
- **React Router** for navigation between pages
- **Socket.io-client** for real-time communication
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Key Frontend Structure
- `App.jsx` - Main app component with router configuration
- `menuConfig.jsx` - Navigation configuration for sidebar
- `pages/` - Main page components (Dashboard, Campaigns, Inbox, Settings)
- `components/` - Reusable UI components (Sidebar, MessageForm, etc.)

## Important Implementation Details

### WhatsApp Integration
- Uses QR code authentication - scan QR from console or frontend
- Supports both individual contacts and group messaging
- Handles media attachments (images, documents, etc.)
- Session persistence prevents re-authentication on restart

### Real-time Features
- Socket.io events: `qrCode`, `clientReady`, `clientDisconnected`, `newMessage`, `messageSent`
- In-memory conversation storage with unread message counters
- Automatic message broadcasting to all connected clients

### API Endpoints
- `GET /inbox` - Retrieve all conversations
- `POST /reply` - Send reply to specific chat
- `GET /groups` - Get WhatsApp groups only
- `GET /all-chats` - Get all chats (individuals + groups)
- `POST /send` - Bulk send messages with optional delays and media

### Message Handling
- Distinguishes between individual and group messages
- Media message support with base64 encoding
- Arabic time formatting (`ar-EG` locale)
- Automatic unread message counting

## Development Notes

### File Upload Support
Backend supports file uploads via `express-fileupload` for media attachments in campaigns.

### Delay Configuration
Bulk messaging includes configurable delays (min/max) between messages to avoid rate limiting.

### Session Management
WhatsApp session data is stored locally in `backend/session/` - do not delete this during development to avoid re-authentication.

### Mixed Language Support
UI contains both English and Arabic text, with RTL support considerations in the frontend.

## Common Issues
- If WhatsApp client disconnects, check console for QR code or connection issues
- Media downloads may fail - error handling is in place for graceful degradation
- Group message handling requires proper author identification for display

## Version History
The `Versions/` directory contains dated snapshots of the codebase for reference.