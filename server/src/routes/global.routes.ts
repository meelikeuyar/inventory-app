import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { escapeRegex } from '../utils/escapeRegex';
import { InventoryItem } from '../models/InventoryItem';
import { Project } from '../models/Project';
import { Site } from '../models/Site';
import { AuditLog } from '../models/AuditLog';

const router = Router();

// All global routes require authentication
router.use(authenticate);

/**
 * GET /api/inventory — Global inventory list with filtering and pagination
 */
router.get('/inventory', async (req: AuthRequest, res, next) => {
  try {
    const { search, page = '1', limit = '50', vendor, status, os } = req.query;
    const filter: Record<string, unknown> = {};

    if (search) {
      const r = new RegExp(escapeRegex(String(search)), 'i');
      filter.$or = [{ name: r }, { ipAddress: r }, { serialNumber: r }, { vendor: r }];
    }
    if (vendor) filter.vendor = vendor;
    if (status) filter.status = status;
    if (os) filter.os = os;

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));

    const [items, total] = await Promise.all([
      InventoryItem.find(filter)
        .populate('site', 'name code')
        .populate('addedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      InventoryItem.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/activity — Recent audit log entries
 */
router.get('/activity', async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit as string) || 30);
    const logs = await AuditLog.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  } catch (err) { next(err); }
});

/**
 * GET /api/dashboard/stats — Dashboard statistics (cached 60s)
 */
router.get('/dashboard/stats', cacheMiddleware(60), async (_req, res, next) => {
  try {
    const [projects, sites, items, statusAgg, vendorAgg, osAgg] = await Promise.all([
      Project.countDocuments(),
      Site.countDocuments(),
      InventoryItem.countDocuments(),
      InventoryItem.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      InventoryItem.aggregate([
        { $match: { vendor: { $ne: '' } } },
        { $group: { _id: '$vendor', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      InventoryItem.aggregate([
        { $match: { os: { $ne: '' } } },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const offline = statusAgg.find((s: any) => s._id === 'inactive')?.count || 0;
    const maintenance = statusAgg.find((s: any) => s._id === 'maintenance')?.count || 0;
    const warrantyExpiring = await InventoryItem.countDocuments({
      warrantyDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gte: new Date() },
    });

    res.json({
      projects, sites, items, offline, maintenance, warrantyExpiring,
      statusDistribution: statusAgg, vendorDistribution: vendorAgg, osDistribution: osAgg,
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/search — Global search across inventory
 */
router.get('/search', async (req: AuthRequest, res, next) => {
  try {
    const q = String(req.query.q || '');
    if (q.length < 2) { res.json([]); return; }

    const regex = new RegExp(escapeRegex(q), 'i');
    const items = await InventoryItem.find({
      $or: [{ name: regex }, { ipAddress: regex }, { serialNumber: regex }, { vendor: regex }, { model: regex }, { rack: regex }],
    })
      .populate('site', 'name code')
      .limit(20);
    res.json(items);
  } catch (err) { next(err); }
});

/**
 * GET /api/filter-options — Distinct vendor, os, rack values (cached 300s)
 */
router.get('/filter-options', cacheMiddleware(300), async (_req, res, next) => {
  try {
    const [vendors, osList, racks] = await Promise.all([
      InventoryItem.distinct('vendor').then(v => v.filter(Boolean).sort()),
      InventoryItem.distinct('os').then(v => v.filter(Boolean).sort()),
      InventoryItem.distinct('rack').then(v => v.filter(Boolean).sort()),
    ]);
    res.json({ vendors, osList, racks });
  } catch (err) { next(err); }
});

/**
 * GET /api/health — Public health check (no auth needed)
 */
// Mounted separately without authenticate middleware
export const healthRouter = Router();
healthRouter.get('/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const status = dbState === 1 ? 'healthy' : 'degraded';
  res.status(status === 'healthy' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbState === 1 ? 'connected' : 'disconnected',
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heap: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  });
});

export default router;
