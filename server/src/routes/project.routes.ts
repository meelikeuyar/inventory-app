import { Router } from 'express';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { projectSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', authorize('admin', 'project_manager'), validate(projectSchema), createProject);
router.put('/:id', authorize('admin', 'project_manager'), validate(projectSchema), updateProject);
router.delete('/:id', authorize('admin', 'project_manager'), deleteProject);

export default router;
