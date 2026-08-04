import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';
import { auditService } from '../services/audit.service';

export async function getItems(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.findAll(req.params.projectId, req.params.siteId, req.userId!, req.query as Record<string, string>); res.json(data); } catch (err) { next(err); }
}

export async function getItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.findById(req.params.projectId, req.params.siteId, req.params.id, req.userId!); res.json(data); } catch (err) { next(err); }
}

export async function createItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.create(req.params.projectId, req.params.siteId, req.userId!, req.body); res.status(201).json(data); } catch (err) { next(err); }
}

export async function updateItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.update(req.params.projectId, req.params.siteId, req.params.id, req.userId!, req.body); res.json(data); } catch (err) { next(err); }
}

export async function deleteItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.delete(req.params.projectId, req.params.siteId, req.params.id, req.userId!); res.json(data); } catch (err) { next(err); }
}

export async function bulkImport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.bulkImport(req.params.projectId, req.params.siteId, req.userId!, req.body.items); res.status(201).json(data); } catch (err) { next(err); }
}

export async function bulkDelete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.bulkDelete(req.params.projectId, req.params.siteId, req.userId!, req.body.itemIds); res.json(data); } catch (err) { next(err); }
}

export async function bulkUpdate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.bulkUpdate(req.params.projectId, req.params.siteId, req.userId!, req.body.itemIds, req.body.updates); res.json(data); } catch (err) { next(err); }
}

export async function bulkMoveSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.bulkMoveSite(req.params.projectId, req.params.siteId, req.userId!, req.body.itemIds, req.body.targetSiteId); res.json(data); } catch (err) { next(err); }
}

export async function getRackView(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await inventoryService.getRackView(req.params.projectId, req.params.siteId, req.userId!); res.json(data); } catch (err) { next(err); }
}

export async function getTimeline(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { const data = await auditService.getTimeline(req.params.id, req.query as Record<string, string>); res.json(data); } catch (err) { next(err); }
}
