import mongoose, { Schema, Types } from 'mongoose';

export interface IMaintenanceRecord {
  asset: Types.ObjectId;
  type: 'preventive' | 'corrective' | 'upgrade' | 'inspection';
  description: string;
  cost: number;
  parts: string;
  performedBy: Types.ObjectId;
  scheduledDate: Date | null;
  completedDate: Date | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceSchema = new Schema(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    type: { type: String, enum: ['preventive', 'corrective', 'upgrade', 'inspection'], required: true },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, default: 0 },
    parts: { type: String, default: '', trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledDate: { type: Date, default: null },
    completedDate: { type: Date, default: null },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

maintenanceSchema.index({ asset: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ scheduledDate: 1 });

export const MaintenanceRecord = mongoose.model<IMaintenanceRecord>('MaintenanceRecord', maintenanceSchema);
