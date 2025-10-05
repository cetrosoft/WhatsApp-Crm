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
import profileRoutes from './routes/profileRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';

// CRM Routes
import contactRoutes from './routes/contactRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import pipelineRoutes from './routes/pipelineRoutes.js';

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/organization', organizationRoutes);

// CRM Routes
app.use('/api/crm/contacts', contactRoutes);
app.use('/api/crm/companies', companyRoutes);
app.use('/api/crm/deals', dealRoutes);
app.use('/api/crm/pipelines', pipelineRoutes);

// WhatsApp Routes (existing)
app.use('/', chatRoutes);
app.use('/', messageRoutes);
app.use('/', profileRoutes);
app.use('/', exportRoutes);

// Start server
server.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);