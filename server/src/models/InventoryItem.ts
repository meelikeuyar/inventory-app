import mongoose, { Schema, Types } from 'mongoose';

export interface IInventoryItem {
  assetId: string;
  name: string;
  ipAddress: string;
  serialNumber: string;
  vendor: string;
  model: string;
  category: 'server' | 'switch' | 'router' | 'firewall' | 'laptop' | 'desktop' | 'monitor' | 'printer' | 'phone' | 'storage' | 'ups' | 'other';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  cpu: string;
  ram: string;
  storage: string;
  os: string;
  rack: string;
  cabinet: string;
  rackPosition: number;
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  warrantyDate: Date | null;
  purchaseDate: Date | null;
  purchasePrice: number;
  supplier: string;
  invoiceNumber: string;
  assignedTo: Types.ObjectId | null;
  department: Types.ObjectId | null;
  notes: string;
  site: Types.ObjectId;
  addedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const inventoryItemSchema = new Schema(
  {
    assetId: { type: String, unique: true, sparse: true, immutable: true },
    name: { type: String, required: true, trim: true },
    ipAddress: { type: String, default: '', trim: true },
    serialNumber: { type: String, default: '', trim: true },
    vendor: { type: String, default: '', trim: true },
    model: { type: String, default: '', trim: true },
    category: { type: String, enum: ['server','switch','router','firewall','laptop','desktop','monitor','printer','phone','storage','ups','other'], default: 'other' },
    criticality: { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
    cpu: { type: String, default: '', trim: true },
    ram: { type: String, default: '', trim: true },
    storage: { type: String, default: '', trim: true },
    os: { type: String, default: '', trim: true },
    rack: { type: String, default: '', trim: true },
    cabinet: { type: String, default: '', trim: true },
    rackPosition: { type: Number, default: 0 },
    status: { type: String, enum: ['active','inactive','maintenance','decommissioned'], default: 'active' },
    warrantyDate: { type: Date, default: null },
    purchaseDate: { type: Date, default: null },
    purchasePrice: { type: Number, default: 0 },
    supplier: { type: String, default: '', trim: true },
    invoiceNumber: { type: String, default: '', trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    notes: { type: String, default: '', trim: true },
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

inventoryItemSchema.pre('save', async function (next) {
  if (this.isNew && !this.assetId) {
    const year = new Date().getFullYear();
    const counter = await (Counter as any).findByIdAndUpdate('assetId', { $inc: { seq: 1 } }, { upsert: true, new: true });
    this.assetId = `AST-${year}-${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

inventoryItemSchema.index({ site: 1 });
inventoryItemSchema.index({ assetId: 1 });
inventoryItemSchema.index({ department: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ name: 'text', serialNumber: 'text', vendor: 'text', rack: 'text' });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
