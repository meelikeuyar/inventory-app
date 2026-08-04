import { Project, IProject } from '../models/Project';
import { Site } from '../models/Site';
import { InventoryItem } from '../models/InventoryItem';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export interface EnrichedProject extends Omit<IProject, keyof Document> {
  siteCount: number;
  itemCount: number;
}

export class ProjectService {
  async findAllByOwner(userId: string) {
    const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 });
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const sites = await Site.find({ project: p._id });
        const siteIds = sites.map((s) => s._id);
        const itemCount = await InventoryItem.countDocuments({ site: { $in: siteIds } });
        return { ...p.toJSON(), siteCount: sites.length, itemCount };
      })
    );
    logger.info('Projects fetched', { userId, count: enriched.length });
    return enriched;
  }

  async create(data: { name: string; description?: string }, userId: string) {
    const project = await Project.create({ ...data, owner: userId });
    logger.info('Project created', { projectId: project.id, userId });
    return { ...project.toJSON(), siteCount: 0, itemCount: 0 };
  }

  async update(id: string, data: Partial<{ name: string; description: string }>, userId: string) {
    const project = await Project.findOneAndUpdate(
      { _id: id, owner: userId },
      data,
      { new: true }
    );
    if (!project) throw AppError.notFound('Proje bulunamadı');
    logger.info('Project updated', { projectId: id, userId });
    return project;
  }

  async delete(id: string, userId: string) {
    const project = await Project.findOneAndDelete({ _id: id, owner: userId });
    if (!project) throw AppError.notFound('Proje bulunamadı');

    const sites = await Site.find({ project: project._id });
    const siteIds = sites.map((s) => s._id);
    const deletedItems = await InventoryItem.deleteMany({ site: { $in: siteIds } });
    const deletedSites = await Site.deleteMany({ project: project._id });

    logger.info('Project deleted (cascade)', {
      projectId: id, userId,
      deletedSites: deletedSites.deletedCount,
      deletedItems: deletedItems.deletedCount,
    });
    return { message: 'Proje ve ilişkili veriler silindi' };
  }
}

export const projectService = new ProjectService();
