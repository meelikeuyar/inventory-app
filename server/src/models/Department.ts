import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description: string;
  manager: Types.ObjectId | null;
  parentDepartment: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '', trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    parentDepartment: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

departmentSchema.index({ code: 1 });
departmentSchema.index({ parentDepartment: 1 });

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
