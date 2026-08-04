import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { siteService } from '../services/site.service';

export async function getSites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await siteService.findAll(req.params.projectId, req.userId!);
    res.json(data);
  } catch (err) { next(err); }
}

export async function createSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await siteService.create(req.params.projectId, req.userId!, req.body);
    res.status(201).json(data);
  } catch (err) {
    if ((err as any).code === 11000) {
      res.status(409).json({ message: 'Bu site kodu zaten mevcut' });
      return;
    }
    next(err);
  }
}

export async function updateSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await siteService.update(req.params.projectId, req.params.id, req.userId!, req.body);
    res.json(data);
  } catch (err) { next(err); }
}

export async function deleteSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await siteService.delete(req.params.projectId, req.params.id, req.userId!);
    res.json(data);
  } catch (err) { next(err); }
}
