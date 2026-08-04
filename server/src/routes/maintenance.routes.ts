import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { getMaintenanceRecords, createMaintenance, updateMaintenance, completeMaintenance, deleteMaintenance, getMaintenanceStats, getWarrantyReport, getCostReport } from '../controllers/maintenance.controller';

const router = Router();
router.use(authenticate);

router.get('/', getMaintenanceRecords);
router.get('/stats', getMaintenanceStats);
router.get('/warranty', getWarrantyReport);
router.get('/cost', getCostReport);
router.post('/', authorize('admin', 'project_manager', 'engineer', 'technician'), createMaintenance);
router.put('/:id', authorize('admin', 'project_manager', 'engineer', 'technician'), updateMaintenance);
router.put('/:id/complete', authorize('admin', 'project_manager', 'engineer', 'technician'), completeMaintenance);
router.delete('/:id', authorize('admin', 'project_manager'), deleteMaintenance);

export default router;
