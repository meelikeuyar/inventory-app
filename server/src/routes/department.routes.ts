import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, getDepartmentStats } from '../controllers/department.controller';

const router = Router();
router.use(authenticate);

router.get('/', getDepartments);
router.get('/stats', getDepartmentStats);
router.get('/:id', getDepartment);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

export default router;
