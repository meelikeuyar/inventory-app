import { Router } from 'express';
import { getSites, createSite, updateSite, deleteSite } from '../controllers/site.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { siteSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get('/:projectId/sites', getSites);
router.post('/:projectId/sites', authorize('admin', 'project_manager', 'engineer'), validate(siteSchema), createSite);
router.put('/:projectId/sites/:id', authorize('admin', 'project_manager', 'engineer'), validate(siteSchema), updateSite);
router.delete('/:projectId/sites/:id', authorize('admin', 'project_manager', 'engineer'), deleteSite);

export default router;
