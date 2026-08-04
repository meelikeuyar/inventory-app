import { Site } from '../models/Site';
import { Project } from '../models/Project';
import { InventoryItem } from '../models/InventoryItem';
import { AppError } from '../utils/AppError';
import { pickFields } from '../utils/sanitize';
import { SITE_UPDATABLE_FIELDS } from '../utils/constants';
import { emitNotification } from '../config/socket';
import logger from '../utils/logger';

export class SiteService {
  private async verifyProjectOwner(projectId: string, userId: string) {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) throw AppError.notFound('Proje bulunamadı');
    return project;
  }

  async findAll(projectId: string, userId: string) {
    const project = await this.verifyProjectOwner(projectId, userId);
    const sites = await Site.find({ project: project._id }).sort({ name: 1 });

    const enriched = await Promise.all(
      sites.map(async (s) => {
        const itemCount = await InventoryItem.countDocuments({ site: s._id });
        return { ...s.toJSON(), itemCount };
      }),
    );
    return enriched;
  }

  async create(projectId: string, userId: string, data: Record<string, unknown>) {
    const project = await this.verifyProjectOwner(projectId, userId);
    const cleanData = pickFields(data, SITE_UPDATABLE_FIELDS);
    const site = await Site.create({ ...cleanData, project: project._id });
    emitNotification({ type: 'site_created', data: { name: site.name, user: userId, timestamp: new Date().toISOString(), entityId: site.id } });
    logger.info('Site created', { siteId: site.id, projectId, userId });
    return { ...site.toJSON(), itemCount: 0 };
  }

  async update(projectId: string, siteId: string, userId: string, data: Record<string, unknown>) {
    const project = await this.verifyProjectOwner(projectId, userId);
    // ── FIXED: whitelist fields to prevent prototype pollution ──
    const cleanData = pickFields(data, SITE_UPDATABLE_FIELDS);
    const site = await Site.findOneAndUpdate(
      { _id: siteId, project: project._id },
      cleanData,
      { new: true },
    );
    if (!site) throw AppError.notFound('Site bulunamadı');
    logger.info('Site updated', { siteId, projectId, userId });
    return site;
  }

  async delete(projectId: string, siteId: string, userId: string) {
    const project = await this.verifyProjectOwner(projectId, userId);
    const site = await Site.findOneAndDelete({ _id: siteId, project: project._id });
    if (!site) throw AppError.notFound('Site bulunamadı');
    await InventoryItem.deleteMany({ site: site._id });
    emitNotification({ type: 'site_deleted', data: { name: site.name, user: userId, timestamp: new Date().toISOString(), entityId: site.id } });
    logger.info('Site deleted (cascade)', { siteId, projectId, userId });
    return { message: 'Site ve envanter kayıtları silindi' };
  }
}

export const siteService = new SiteService();
