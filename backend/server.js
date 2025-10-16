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
import roleRoutes from './routes/roleRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import countriesRoutes from './routes/countriesRoutes.js';
import statusesRoutes from './routes/statusesRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import leadSourcesRoutes from './routes/leadSourcesRoutes.js';
import menuRoutes from './routes/menuRoutes.js';

// Super Admin Routes
import superAdminAuthRoutes from './routes/superAdminAuthRoutes.js';
import superAdminOrgRoutes from './routes/superAdminOrgRoutes.js';
import superAdminStatsRoutes from './routes/superAdminStatsRoutes.js';
import superAdminPackageRoutes from './routes/superAdminPackageRoutes.js';
import superAdminMenuRoutes from './routes/superAdminMenuRoutes.js';

// Verify super admin routes loaded successfully
console.log('✅ Super Admin Routes loaded:', {
  auth: !!superAdminAuthRoutes,
  org: !!superAdminOrgRoutes,
  stats: !!superAdminStatsRoutes
});

// CRM Routes
import contactRoutes from './routes/contactRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import pipelineRoutes from './routes/pipelineRoutes.js';
import segmentRoutes from './routes/segmentRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

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

// ⚠️ WhatsApp initialization temporarily disabled due to browser lock error
// TODO: Fix WhatsApp Chromium browser lock issue before re-enabling
// Initialize WhatsApp client
// whatsappClient.initialize(io);

// Setup message processing
// whatsappClient.getClient().on("message", (msg) => {
//   processIncomingMessage(msg, io);
// });

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    routes: {
      superAdmin: {
        auth: !!superAdminAuthRoutes,
        org: !!superAdminOrgRoutes,
        stats: !!superAdminStatsRoutes
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/statuses', statusesRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/lead-sources', leadSourcesRoutes);
app.use('/api/menu', menuRoutes);

// Super Admin Routes (Platform-level administration)
app.use('/api/super-admin', superAdminAuthRoutes);
app.use('/api/super-admin/organizations', superAdminOrgRoutes);
app.use('/api/super-admin/stats', superAdminStatsRoutes);
app.use('/api/super-admin/packages', superAdminPackageRoutes);
app.use('/api/super-admin/menus', superAdminMenuRoutes);

// CRM Routes
app.use('/api/crm/contacts', contactRoutes);
app.use('/api/crm/companies', companyRoutes);
app.use('/api/crm/deals', dealRoutes);
app.use('/api/crm/pipelines', pipelineRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/tickets', ticketRoutes);

// WhatsApp Routes (existing)
app.use('/', chatRoutes);
app.use('/', messageRoutes);
app.use('/', profileRoutes);
app.use('/', exportRoutes);

// Start server
server.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);