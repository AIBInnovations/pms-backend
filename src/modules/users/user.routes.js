import { Router } from 'express';
import userController from './user.controller.js';
import { auth, rbac, validate } from '../../middleware/index.js';
import {
  createUserSchema,
  updateUserSchema,
  updateRoleSchema,
  updateStatusSchema,
  changePasswordSchema,
  querySchema,
} from './user.validation.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Profile routes (any authenticated user)
router.get('/profile', userController.getProfile.bind(userController));
router.patch('/profile', validate(updateUserSchema), userController.updateProfile.bind(userController));
router.patch('/change-password', validate(changePasswordSchema), userController.changePassword.bind(userController));

// Read-only user listing (Admin + PM need this for dropdowns)
router.get('/', rbac('super_admin', 'project_manager'), validate(querySchema, 'query'), userController.getAll.bind(userController));
router.get('/:id', rbac('super_admin', 'project_manager'), userController.getById.bind(userController));

// Admin-only write operations
router.post('/', rbac('super_admin'), validate(createUserSchema), userController.create.bind(userController));
router.patch('/:id', rbac('super_admin'), validate(updateUserSchema), userController.update.bind(userController));
router.patch('/:id/role', rbac('super_admin'), validate(updateRoleSchema), userController.updateRole.bind(userController));
router.patch('/:id/status', rbac('super_admin'), validate(updateStatusSchema), userController.updateStatus.bind(userController));
router.delete('/:id', rbac('super_admin'), userController.delete.bind(userController));

export default router;
