import { Router } from 'express';
import { getItems, getItem, createItem, updateItem, deleteItem, bulkImport, bulkDelete, bulkUpdate, bulkMoveSite, getRackView, getTimeline } from '../controllers/inventory.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { inventoryItemSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);

router.get('/:projectId/sites/:siteId/items', getItems);
router.get('/:projectId/sites/:siteId/items/rack-view', getRackView);
router.get('/:projectId/sites/:siteId/items/:id', getItem);
router.get('/:projectId/sites/:siteId/items/:id/timeline', getTimeline);
router.post('/:projectId/sites/:siteId/items', authorize('admin', 'project_manager', 'engineer', 'technician'), validate(inventoryItemSchema), createItem);
router.post('/:projectId/sites/:siteId/items/bulk', authorize('admin', 'project_manager', 'engineer'), bulkImport);
router.post('/:projectId/sites/:siteId/items/bulk-delete', authorize('admin', 'project_manager'), bulkDelete);
router.post('/:projectId/sites/:siteId/items/bulk-update', authorize('admin', 'project_manager', 'engineer', 'technician'), bulkUpdate);
router.post('/:projectId/sites/:siteId/items/bulk-move', authorize('admin', 'project_manager'), bulkMoveSite);
router.put('/:projectId/sites/:siteId/items/:id', authorize('admin', 'project_manager', 'engineer', 'technician'), validate(inventoryItemSchema), updateItem);
router.delete('/:projectId/sites/:siteId/items/:id', authorize('admin', 'project_manager'), deleteItem);

export default router;
