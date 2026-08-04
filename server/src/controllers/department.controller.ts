import { Request, Response } from 'express';
import { Department } from '../models/Department';
import { InventoryItem } from '../models/InventoryItem';
import { User } from '../models/User';

export const getDepartments = async (req: Request, res: Response) => {
  const departments = await Department.find().populate('manager', 'fullName email').populate('parentDepartment', 'name code').sort('name');
  const result = await Promise.all(departments.map(async (d) => {
    const assetCount = await InventoryItem.countDocuments({ department: d._id });
    const userCount = await User.countDocuments({ department: d._id, isActive: true });
    return { ...d.toJSON(), assetCount, userCount };
  }));
  res.json(result);
};

export const getDepartment = async (req: Request, res: Response) => {
  const dept = await Department.findById(req.params.id).populate('manager', 'fullName email').populate('parentDepartment', 'name code');
  if (!dept) return res.status(404).json({ message: 'Departman bulunamadi' });
  const assetCount = await InventoryItem.countDocuments({ department: dept._id });
  const userCount = await User.countDocuments({ department: dept._id, isActive: true });
  res.json({ ...dept.toJSON(), assetCount, userCount });
};

export const createDepartment = async (req: Request, res: Response) => {
  const { name, code, description, manager, parentDepartment } = req.body;
  if (!name || !code) return res.status(400).json({ message: 'Ad ve kod zorunludur' });
  const exists = await Department.findOne({ code: code.toUpperCase() });
  if (exists) return res.status(400).json({ message: 'Bu kod zaten kullaniliyor' });
  const dept = await Department.create({ name, code: code.toUpperCase(), description, manager: manager || null, parentDepartment: parentDepartment || null });
  res.status(201).json(dept);
};

export const updateDepartment = async (req: Request, res: Response) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dept) return res.status(404).json({ message: 'Departman bulunamadi' });
  res.json(dept);
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const assetCount = await InventoryItem.countDocuments({ department: req.params.id });
  if (assetCount > 0) return res.status(400).json({ message: `Bu departmanda ${assetCount} varlik var. Once varliklari tasiyin.` });
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Departman bulunamadi' });
  res.json({ message: 'Departman silindi' });
};

export const getDepartmentStats = async (req: Request, res: Response) => {
  const departments = await Department.find({ isActive: true }).select('name code');
  const stats = await Promise.all(departments.map(async (d) => {
    const total = await InventoryItem.countDocuments({ department: d._id });
    const active = await InventoryItem.countDocuments({ department: d._id, status: 'active' });
    const maintenance = await InventoryItem.countDocuments({ department: d._id, status: 'maintenance' });
    const warrantyExpiring = await InventoryItem.countDocuments({ department: d._id, warrantyDate: { $lte: new Date(Date.now() + 90 * 86400000), $gte: new Date() } });
    return { _id: d._id, name: d.name, code: d.code, total, active, maintenance, warrantyExpiring };
  }));
  res.json(stats);
};
