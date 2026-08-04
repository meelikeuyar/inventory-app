import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Gecerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Sifre en az 6 karakter olmalidir'),
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalidir'),
});

export const loginSchema = z.object({
  email: z.string().email('Gecerli bir e-posta adresi giriniz'),
  password: z.string().min(1, 'Sifre zorunludur'),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Proje adi zorunludur').max(100),
  description: z.string().max(500).optional(),
});

export const siteSchema = z.object({
  name: z.string().min(1, 'Site adi zorunludur').max(100),
  code: z.string().min(2, 'Site kodu en az 2 karakter olmalidir').max(5).transform((val) => val.toUpperCase()),
});

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Cihaz adi zorunludur').max(200),
  ipAddress: z.string().max(100).optional().default(''),
  serialNumber: z.string().max(100).optional().default(''),
  vendor: z.string().max(100).optional().default(''),
  model: z.string().max(100).optional().default(''),
  category: z.enum(['server', 'switch', 'router', 'firewall', 'laptop', 'desktop', 'monitor', 'printer', 'phone', 'storage', 'ups', 'other']).optional().default('other'),
  criticality: z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
  cpu: z.string().max(100).optional().default(''),
  ram: z.string().max(50).optional().default(''),
  storage: z.string().max(100).optional().default(''),
  os: z.string().max(100).optional().default(''),
  rack: z.string().max(50).optional().default(''),
  cabinet: z.string().max(50).optional().default(''),
  rackPosition: z.number().min(0).max(48).optional().default(0),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']).optional().default('active'),
  warrantyDate: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0).optional().default(0),
  supplier: z.string().max(200).optional().default(''),
  invoiceNumber: z.string().max(100).optional().default(''),
  department: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().default(''),
});
