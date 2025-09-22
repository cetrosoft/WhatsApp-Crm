import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import { createServer } from "http";

// Import services and configurations
import { configureSocket } from './config/socket.js';
import whatsappClient from './services/whatsappClient.js';
import { setupSocketHandlers } from './services/socketHandler.js';
import { processIncomingMessage } from './controllers/messageController.js';

// Import routes
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();
const server = createServer(app);

// Configure Socket.io
const io = configureSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  defCharset: 'utf8',
  defParamCharset: 'utf8'
}));

// Setup Socket.io handlers and middleware
const socketMiddleware = setupSocketHandlers(io, whatsappClient);
app.use(socketMiddleware);

// Initialize WhatsApp client
whatsappClient.initialize(io);

// Setup message processing
whatsappClient.getClient().on("message", (msg) => {
  processIncomingMessage(msg, io);
});

// Routes
app.use('/', chatRoutes);
app.use('/', messageRoutes);

// Start server
server.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);