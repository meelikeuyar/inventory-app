import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { projectService } from '../services/project.service';

export async function getProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await projectService.findAllByOwner(req.userId!);
    res.json(data);
  } catch (err) { next(err); }
}

export async function createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await projectService.create(req.body, req.userId!);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await projectService.update(req.params.id, req.body, req.userId!);
    res.json(data);
  } catch (err) { next(err); }
}

export async function deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await projectService.delete(req.params.id, req.userId!);
    res.json(data);
  } catch (err) { next(err); }
}
