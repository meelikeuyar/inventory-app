import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import siteRoutes from './routes/site.routes';
import inventoryRoutes from './routes/inventory.routes';
import userRoutes from './routes/user.routes';
import docsRoutes from './routes/docs.routes';
import departmentRoutes from './routes/department.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import insightsRoutes from './routes/insights.routes';
import metricsRoutes from './routes/metrics.routes';
import globalRoutes, { healthRouter } from './routes/global.routes';

const app = express();

// ── Security & parsing ──
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ── Rate limiting ──
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', siteRoutes);
app.use('/api/projects', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api', docsRoutes);
app.use('/api', metricsRoutes);
app.use('/api', globalRoutes);      // authenticated: inventory, activity, dashboard, search, filter-options
app.use('/api', healthRouter);      // public: health check

// ── Error handling ──
app.use(errorHandler);

export default app;
