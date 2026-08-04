import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IRefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'project_manager' | 'engineer' | 'viewer' | 'department_manager' | 'technician' | 'auditor';
  department: Types.ObjectId | null;
  title: string;
  isActive: boolean;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'project_manager', 'engineer', 'viewer', 'department_manager', 'technician', 'auditor'], default: 'engineer' },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    title: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    refreshTokens: {
      type: [{ token: String, expiresAt: Date, createdAt: { type: Date, default: Date.now } }],
      default: [],
      select: false,
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ department: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
