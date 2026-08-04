import { Router } from 'express';
import { getUsers, updateUserRole, toggleUserActive, resetPassword } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/toggle-active', toggleUserActive);
router.post('/:id/reset-password', resetPassword);

export default router;
