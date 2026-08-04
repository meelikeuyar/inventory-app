import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true },
  },
);

projectSchema.virtual('sites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'project',
});

// ── FIXED: owner index for query performance ──
projectSchema.index({ owner: 1, createdAt: -1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
