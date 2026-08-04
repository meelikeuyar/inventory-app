import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { next(err); }
}

export async function updateUserRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = req.body;
    if (!['admin', 'project_manager', 'engineer', 'viewer'].includes(role)) throw AppError.badRequest('Geçersiz rol');
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) throw AppError.notFound('Kullanıcı bulunamadı');
    logger.info('User role updated', { targetUserId: req.params.id, newRole: role, byUserId: req.userId });
    res.json(user);
  } catch (err) { next(err); }
}

export async function toggleUserActive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw AppError.notFound('Kullanıcı bulunamadı');
    user.isActive = !user.isActive;
    await user.save();
    logger.info('User active toggled', { targetUserId: req.params.id, isActive: user.isActive });
    res.json({ isActive: user.isActive });
  } catch (err) { next(err); }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) throw AppError.notFound('Kullanıcı bulunamadı');
    user.password = req.body.password;
    if (!user.password || user.password.length < 6) throw AppError.badRequest('Şifre en az 6 karakter olmalıdır');
    await user.save();
    logger.info('User password reset', { targetUserId: req.params.id, byUserId: req.userId });
    res.json({ message: 'Şifre sıfırlandı' });
  } catch (err) { next(err); }
}
