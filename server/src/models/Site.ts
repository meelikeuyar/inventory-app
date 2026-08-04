import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISite extends Document {
  name: string;
  code: string;
  project: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true },
  }
);

siteSchema.virtual('items', {
  ref: 'InventoryItem',
  localField: '_id',
  foreignField: 'site',
});

siteSchema.index({ project: 1, code: 1 }, { unique: true });

export const Site = mongoose.model<ISite>('Site', siteSchema);
