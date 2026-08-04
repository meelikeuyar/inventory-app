import { InventoryItem } from '../models/InventoryItem';
import { Site } from '../models/Site';
import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import { escapeRegex } from '../utils/escapeRegex';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { BULK_IMPORT_MAX_ITEMS, INVENTORY_UPDATABLE_FIELDS } from '../utils/constants';
import { pickFields } from '../utils/sanitize';
import { inventoryItemSchema } from '../validators/schemas';
import { auditService } from './audit.service';
import { emitNotification } from '../config/socket';
import { invalidateCache } from '../middleware/cache';
import logger from '../utils/logger';

export class InventoryService {
  private async verifySiteAccess(projectId: string, siteId: string, userId: string) {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) throw AppError.notFound('Proje bulunamadı');
    const site = await Site.findOne({ _id: siteId, project: project._id });
    if (!site) throw AppError.notFound('Site bulunamadı');
    return site.id as string;
  }

  async findAll(
    projectId: string,
    siteId: string,
    userId: string,
    query: { search?: string; page?: string; limit?: string; vendor?: string; status?: string; os?: string; rack?: string; warrantyBefore?: string; warrantyAfter?: string },
  ) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { site: verifiedSiteId };

    // ── FIXED: escapeRegex applied to prevent ReDoS / NoSQL injection ──
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i');
      filter.$or = [{ name: regex }, { serialNumber: regex }, { ipAddress: regex }, { vendor: regex }, { model: regex }, { rack: regex }];
    }
    if (query.vendor) filter.vendor = query.vendor;
    if (query.status) filter.status = query.status;
    if (query.os) filter.os = query.os;
    if (query.rack) filter.rack = query.rack;
    if (query.warrantyBefore) filter.warrantyDate = { ...(filter.warrantyDate as object || {}), $lte: new Date(query.warrantyBefore) };
    if (query.warrantyAfter) filter.warrantyDate = { ...(filter.warrantyDate as object || {}), $gte: new Date(query.warrantyAfter) };

    const [items, total] = await Promise.all([
      InventoryItem.find(filter).populate('addedBy', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      InventoryItem.countDocuments(filter),
    ]);
    return { items, pagination: paginationMeta(page, limit, total) };
  }

  async findById(projectId: string, siteId: string, itemId: string, userId: string) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    const item = await InventoryItem.findOne({ _id: itemId, site: verifiedSiteId }).populate('addedBy', 'fullName email');
    if (!item) throw AppError.notFound('Kayıt bulunamadı');
    return item;
  }

  async create(projectId: string, siteId: string, userId: string, data: Record<string, unknown>) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    const cleanData = pickFields(data, INVENTORY_UPDATABLE_FIELDS);
    const item = await InventoryItem.create({ ...cleanData, site: verifiedSiteId, addedBy: userId });
    await auditService.log({ entityType: 'inventory', entityId: item.id, action: 'created', userId, changes: [{ field: 'name', oldValue: '', newValue: item.name }], metadata: { siteId: verifiedSiteId, projectId } });
    emitNotification({ type: 'inventory_created', data: { name: item.name, user: userId, timestamp: new Date().toISOString(), entityId: item.id } });
    invalidateCache(['/api/dashboard/stats*', '/api/filter-options*']);
    logger.info('Inventory item created', { itemId: item.id, siteId: verifiedSiteId, userId });
    return item;
  }

  async update(projectId: string, siteId: string, itemId: string, userId: string, data: Record<string, unknown>) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    const oldItem = await InventoryItem.findOne({ _id: itemId, site: verifiedSiteId });
    if (!oldItem) throw AppError.notFound('Kayıt bulunamadı');

    const cleanData = pickFields(data, INVENTORY_UPDATABLE_FIELDS);
    const trackFields = [...INVENTORY_UPDATABLE_FIELDS];
    const changes = auditService.diffFields(oldItem.toObject() as Record<string, unknown>, cleanData, trackFields);
    const item = await InventoryItem.findOneAndUpdate({ _id: itemId, site: verifiedSiteId }, cleanData, { new: true });

    if (changes.length > 0) {
      await auditService.log({ entityType: 'inventory', entityId: itemId, action: 'updated', userId, changes, metadata: { siteId: verifiedSiteId, projectId } });
    }
    emitNotification({ type: 'inventory_updated', data: { name: oldItem.name, user: userId, timestamp: new Date().toISOString(), entityId: itemId } });
    logger.info('Inventory item updated', { itemId, userId, changedFields: changes.length });
    return item;
  }

  async delete(projectId: string, siteId: string, itemId: string, userId: string) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    const item = await InventoryItem.findOneAndDelete({ _id: itemId, site: verifiedSiteId });
    if (!item) throw AppError.notFound('Kayıt bulunamadı');
    await auditService.log({ entityType: 'inventory', entityId: itemId, action: 'deleted', userId, changes: [{ field: 'name', oldValue: item.name, newValue: '' }], metadata: { siteId: verifiedSiteId, projectId } });
    emitNotification({ type: 'inventory_deleted', data: { name: item.name, user: userId, timestamp: new Date().toISOString(), entityId: itemId } });
    invalidateCache(['/api/dashboard/stats*', '/api/filter-options*']);
    logger.info('Inventory item deleted', { itemId, userId });
    return { message: 'Kayıt silindi' };
  }

  async bulkImport(projectId: string, siteId: string, userId: string, items: Array<Record<string, unknown>>) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    if (!Array.isArray(items) || items.length === 0) throw AppError.badRequest('Geçerli envanter verileri gerekli');

    // ── FIXED: max item limit to prevent memory issues ──
    if (items.length > BULK_IMPORT_MAX_ITEMS) {
      throw AppError.badRequest(`Tek seferde en fazla ${BULK_IMPORT_MAX_ITEMS} kayıt eklenebilir`);
    }

    // ── Validate each item with Zod schema ──
    const errors: string[] = [];
    const validatedItems: Array<Record<string, unknown>> = [];
    for (let i = 0; i < items.length; i++) {
      const result = inventoryItemSchema.safeParse(items[i]);
      if (!result.success) {
        errors.push(`Satır ${i + 1}: ${result.error.errors.map(e => e.message).join(', ')}`);
      } else {
        validatedItems.push(result.data as Record<string, unknown>);
      }
    }
    if (errors.length > 0) {
      throw AppError.badRequest(`Doğrulama hataları:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... ve ${errors.length - 10} hata daha` : ''}`);
    }

    const docs = validatedItems.map((item) => ({
      ...pickFields(item, [...INVENTORY_UPDATABLE_FIELDS]),
      site: verifiedSiteId,
      addedBy: userId,
    })).filter((d) => d.name && String(d.name).length > 0);

    const created = await InventoryItem.insertMany(docs);
    for (const item of created) {
      await auditService.log({ entityType: 'inventory', entityId: item.id, action: 'imported', userId, changes: [{ field: 'name', oldValue: '', newValue: item.name }] });
    }
    invalidateCache(['/api/dashboard/stats*', '/api/filter-options*']);
    logger.info('Bulk import completed', { siteId: verifiedSiteId, userId, count: created.length });
    return { message: `${created.length} kayıt eklendi`, count: created.length };
  }

  async bulkDelete(projectId: string, siteId: string, userId: string, itemIds: string[]) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    if (!Array.isArray(itemIds) || itemIds.length === 0) throw AppError.badRequest('Silinecek kayıt seçilmedi');
    const items = await InventoryItem.find({ _id: { $in: itemIds }, site: verifiedSiteId });
    const result = await InventoryItem.deleteMany({ _id: { $in: itemIds }, site: verifiedSiteId });
    for (const item of items) {
      await auditService.log({ entityType: 'inventory', entityId: item.id, action: 'deleted', userId, changes: [{ field: 'name', oldValue: item.name, newValue: '' }], metadata: { bulkOperation: true } });
    }
    invalidateCache(['/api/dashboard/stats*', '/api/filter-options*']);
    logger.info('Bulk delete completed', { userId, count: result.deletedCount });
    return { message: `${result.deletedCount} kayıt silindi`, count: result.deletedCount };
  }

  async bulkUpdate(projectId: string, siteId: string, userId: string, itemIds: string[], updates: Record<string, unknown>) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    if (!Array.isArray(itemIds) || itemIds.length === 0) throw AppError.badRequest('Güncellenecek kayıt seçilmedi');

    // ── FIXED: whitelist fields ──
    const cleanUpdates = pickFields(updates, INVENTORY_UPDATABLE_FIELDS);
    if (Object.keys(cleanUpdates).length === 0) throw AppError.badRequest('Güncellenecek alan belirtilmedi');

    const oldItems = await InventoryItem.find({ _id: { $in: itemIds }, site: verifiedSiteId });
    const result = await InventoryItem.updateMany({ _id: { $in: itemIds }, site: verifiedSiteId }, { $set: cleanUpdates });
    for (const oldItem of oldItems) {
      const changes = auditService.diffFields(oldItem.toObject() as Record<string, unknown>, cleanUpdates, Object.keys(cleanUpdates));
      if (changes.length > 0) await auditService.log({ entityType: 'inventory', entityId: oldItem.id, action: 'bulk_updated', userId, changes, metadata: { bulkOperation: true } });
    }
    invalidateCache(['/api/dashboard/stats*', '/api/filter-options*']);
    logger.info('Bulk update completed', { userId, count: result.modifiedCount });
    return { message: `${result.modifiedCount} kayıt güncellendi`, count: result.modifiedCount };
  }

  async bulkMoveSite(projectId: string, siteId: string, userId: string, itemIds: string[], targetSiteId: string) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    const targetSite = await Site.findOne({ _id: targetSiteId, project: projectId });
    if (!targetSite) throw AppError.notFound('Hedef site bulunamadı');
    const oldItems = await InventoryItem.find({ _id: { $in: itemIds }, site: verifiedSiteId });
    const result = await InventoryItem.updateMany({ _id: { $in: itemIds }, site: verifiedSiteId }, { $set: { site: targetSiteId } });
    for (const item of oldItems) {
      await auditService.log({ entityType: 'inventory', entityId: item.id, action: 'moved', userId, changes: [{ field: 'site', oldValue: verifiedSiteId, newValue: targetSiteId }], metadata: { targetSiteName: targetSite.name } });
    }
    invalidateCache(['/api/dashboard/stats*', '/api/filter-options*']);
    logger.info('Bulk move completed', { userId, count: result.modifiedCount, targetSiteId });
    return { message: `${result.modifiedCount} kayıt taşındı`, count: result.modifiedCount };
  }

  async getRackView(projectId: string, siteId: string, userId: string) {
    const verifiedSiteId = await this.verifySiteAccess(projectId, siteId, userId);
    const items = await InventoryItem.find({ site: verifiedSiteId, rack: { $exists: true, $ne: '' } }).populate('addedBy', 'fullName').sort({ rack: 1, rackPosition: 1 });
    const racks: Record<string, unknown[]> = {};
    for (const item of items) {
      const r = item.rack || 'Unassigned';
      if (!racks[r]) racks[r] = [];
      racks[r]!.push(item.toJSON());
    }
    return racks;
  }
}

export const inventoryService = new InventoryService();
