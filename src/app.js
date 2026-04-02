import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { env } from './config/index.js';
import { errorHandler } from './middleware/index.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import commentRoutes from './modules/comments/comment.routes.js';
import activityRoutes from './modules/notifications/activity.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import auditRoutes from './modules/notifications/audit.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';

const app = express();

// Trust proxy (Render/Vercel) so req.ip returns the real client IP
app.set('trust proxy', true);

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sanitize NoSQL injection from request body (Express 5: req.query is read-only)
function sanitizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) { delete obj[key]; }
    else if (typeof obj[key] === 'object') { sanitizeObj(obj[key]); }
  }
  return obj;
}
app.use((req, _res, next) => {
  if (req.body) sanitizeObj(req.body);
  if (req.params) sanitizeObj(req.params);
  next();
});
app.use(hpp());

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PMS API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
});

// Error handler
app.use(errorHandler);

export default app;
