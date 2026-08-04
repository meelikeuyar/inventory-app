import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export function authorize(...roles: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.userId);
      if (!user || !user.isActive) throw AppError.forbidden('Hesap aktif değil');
      if (roles.length > 0 && !roles.includes(user.role)) {
        throw AppError.forbidden('Bu işlem için yetkiniz yok');
      }
      (req as any).userRole = user.role;
      next();
    } catch (err) { next(err); }
  };
}
