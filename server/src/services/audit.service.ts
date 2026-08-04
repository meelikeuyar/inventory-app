import { AuditLog } from '../models/AuditLog';
import logger from '../utils/logger';

interface LogEntry {
  entityType: 'inventory' | 'project' | 'site';
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'imported' | 'bulk_updated';
  userId: string;
  changes?: Array<{ field: string; oldValue: string; newValue: string }>;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  async log(entry: LogEntry) {
    try {
      await AuditLog.create({
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        userId: entry.userId,
        changes: entry.changes || [],
        metadata: entry.metadata || {},
      });
    } catch (err) {
      logger.error('Audit log failed', { error: (err as Error).message, entry });
    }
  }

  async getTimeline(entityId: string, query: { page?: string; limit?: string }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));

    const [logs, total] = await Promise.all([
      AuditLog.find({ entityId })
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments({ entityId }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getRecentActivity(userId?: string, limit = 20) {
    const filter = userId ? { userId } : {};
    return AuditLog.find(filter)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  diffFields(oldDoc: Record<string, unknown>, newData: Record<string, unknown>, fields: string[]) {
    const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
    for (const field of fields) {
      const oldVal = String(oldDoc[field] ?? '');
      const newVal = String(newData[field] ?? '');
      if (oldVal !== newVal) {
        changes.push({ field, oldValue: oldVal, newValue: newVal });
      }
    }
    return changes;
  }
}

export const auditService = new AuditService();
