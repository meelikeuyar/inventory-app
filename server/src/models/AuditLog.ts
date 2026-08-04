import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  entityType: 'inventory' | 'project' | 'site';
  entityId: Types.ObjectId;
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'imported' | 'bulk_updated';
  userId: Types.ObjectId;
  changes: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['inventory', 'project', 'site'],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'deleted', 'moved', 'imported', 'bulk_updated'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changes: [
      {
        field: { type: String, required: true },
        oldValue: { type: String, default: '' },
        newValue: { type: String, default: '' },
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
