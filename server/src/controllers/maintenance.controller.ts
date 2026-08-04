import { Request, Response } from 'express';
import { MaintenanceRecord } from '../models/MaintenanceRecord';
import { InventoryItem } from '../models/InventoryItem';

export const getMaintenanceRecords = async (req: Request, res: Response) => {
  const { assetId, status, type, page = '1', limit = '50' } = req.query;
  const filter: any = {};
  if (assetId) filter.asset = assetId;
  if (status) filter.status = status;
  if (type) filter.type = type;
  const p = Math.max(1, parseInt(String(page)));
  const l = Math.min(100, parseInt(String(limit)));
  const [records, total] = await Promise.all([
    MaintenanceRecord.find(filter).populate('asset', 'name assetId vendor model').populate('performedBy', 'fullName').sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
    MaintenanceRecord.countDocuments(filter),
  ]);
  res.json({ records, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
};

export const createMaintenance = async (req: Request, res: Response) => {
  const { assetId, type, description, cost, parts, scheduledDate, notes } = req.body;
  if (!assetId || !type || !description) return res.status(400).json({ message: 'Asset, tip ve aciklama zorunludur' });
  const asset = await InventoryItem.findById(assetId);
  if (!asset) return res.status(404).json({ message: 'Cihaz bulunamadi' });
  const record = await MaintenanceRecord.create({ asset: assetId, type, description, cost: cost || 0, parts: parts || '', performedBy: (req as any).userId, scheduledDate: scheduledDate || null, notes: notes || '', status: 'scheduled' });
  res.status(201).json(record);
};

export const updateMaintenance = async (req: Request, res: Response) => {
  const record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!record) return res.status(404).json({ message: 'Kayit bulunamadi' });
  res.json(record);
};

export const completeMaintenance = async (req: Request, res: Response) => {
  const record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, { status: 'completed', completedDate: new Date(), ...req.body }, { new: true });
  if (!record) return res.status(404).json({ message: 'Kayit bulunamadi' });
  res.json(record);
};

export const deleteMaintenance = async (req: Request, res: Response) => {
  const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
  if (!record) return res.status(404).json({ message: 'Kayit bulunamadi' });
  res.json({ message: 'Kayit silindi' });
};

export const getMaintenanceStats = async (_req: Request, res: Response) => {
  const [total, scheduled, inProgress, completed, costAgg, typeAgg] = await Promise.all([
    MaintenanceRecord.countDocuments(),
    MaintenanceRecord.countDocuments({ status: 'scheduled' }),
    MaintenanceRecord.countDocuments({ status: 'in_progress' }),
    MaintenanceRecord.countDocuments({ status: 'completed' }),
    MaintenanceRecord.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, totalCost: { $sum: '$cost' } } }]),
    MaintenanceRecord.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);
  res.json({ total, scheduled, inProgress, completed, totalCost: costAgg[0]?.totalCost || 0, byType: typeAgg });
};

export const getWarrantyReport = async (_req: Request, res: Response) => {
  const now = new Date();
  const d30 = new Date(Date.now() + 30 * 86400000);
  const d60 = new Date(Date.now() + 60 * 86400000);
  const d90 = new Date(Date.now() + 90 * 86400000);
  const [expired, critical, high, medium, safe] = await Promise.all([
    InventoryItem.countDocuments({ warrantyDate: { $lt: now, $ne: null } }),
    InventoryItem.countDocuments({ warrantyDate: { $gte: now, $lte: d30 } }),
    InventoryItem.countDocuments({ warrantyDate: { $gt: d30, $lte: d60 } }),
    InventoryItem.countDocuments({ warrantyDate: { $gt: d60, $lte: d90 } }),
    InventoryItem.countDocuments({ warrantyDate: { $gt: d90 } }),
  ]);
  const expiringItems = await InventoryItem.find({ warrantyDate: { $gte: now, $lte: d90, $ne: null } }).select('name assetId vendor model warrantyDate site criticality').populate('site', 'name').sort({ warrantyDate: 1 }).limit(20);
  res.json({ expired, critical, high, medium, safe, noWarranty: await InventoryItem.countDocuments({ warrantyDate: null }), expiringItems });
};

export const getCostReport = async (_req: Request, res: Response) => {
  const purchaseTotal = await InventoryItem.aggregate([{ $group: { _id: null, total: { $sum: '$purchasePrice' } } }]);
  const maintenanceTotal = await MaintenanceRecord.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$cost' } } }]);
  const costByVendor = await InventoryItem.aggregate([{ $match: { purchasePrice: { $gt: 0 } } }, { $group: { _id: '$vendor', total: { $sum: '$purchasePrice' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }, { $limit: 10 }]);
  const costByCategory = await InventoryItem.aggregate([{ $group: { _id: '$category', total: { $sum: '$purchasePrice' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]);
  res.json({
    purchaseTotal: purchaseTotal[0]?.total || 0,
    maintenanceTotal: maintenanceTotal[0]?.total || 0,
    tco: (purchaseTotal[0]?.total || 0) + (maintenanceTotal[0]?.total || 0),
    costByVendor, costByCategory,
  });
};
