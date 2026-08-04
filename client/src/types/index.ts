export interface User { id: string; email: string; fullName: string; role: 'admin' | 'project_manager' | 'engineer' | 'viewer' | 'department_manager' | 'technician' | 'auditor'; isActive?: boolean; department?: string; title?: string; }
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }
export interface Project { _id: string; name: string; description: string; siteCount: number; itemCount: number; createdAt: string; }
export interface Site { _id: string; name: string; code: string; project: string; itemCount: number; createdAt: string; }
export interface InventoryItem {
  _id: string; assetId?: string; name: string; ipAddress: string; serialNumber: string;
  vendor: string; model: string; category?: string; criticality?: string;
  cpu: string; ram: string; storage: string; os: string;
  rack: string; cabinet: string; rackPosition: number;
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  warrantyDate: string | null; purchaseDate?: string | null; purchasePrice?: number;
  supplier?: string; invoiceNumber?: string;
  assignedTo?: { _id: string; fullName: string } | string | null;
  department?: { _id: string; name: string } | string | null;
  notes: string;
  site: string | { _id: string; name: string; code: string };
  addedBy: { fullName: string; email: string }; createdAt: string; updatedAt: string;
}
export interface Department { _id: string; name: string; code: string; description: string; manager?: { _id: string; fullName: string; email: string }; parentDepartment?: { _id: string; name: string; code: string }; isActive: boolean; assetCount: number; userCount: number; createdAt: string; }
export interface Pagination { page: number; limit: number; total: number; pages: number; }
export interface AuditLog {
  _id: string; entityType: string; entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'imported' | 'bulk_updated';
  userId: { fullName: string; email: string };
  changes: Array<{ field: string; oldValue: string; newValue: string }>;
  metadata: Record<string, unknown>; createdAt: string;
}
export interface DashboardStats {
  projects: number; sites: number; items: number; offline: number;
  maintenance: number; warrantyExpiring: number;
  statusDistribution: Array<{ _id: string; count: number }>;
  vendorDistribution: Array<{ _id: string; count: number }>;
  osDistribution: Array<{ _id: string; count: number }>;
}
export interface UserAdmin { _id: string; email: string; fullName: string; role: string; isActive: boolean; department?: string; title?: string; createdAt: string; }
