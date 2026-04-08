import { Router } from 'express';
import controller from './socialPost.controller.js';
import { auth, rbac, validate, upload, routeUpload } from '../../middleware/index.js';
import { createPostSchema, updatePostSchema, rejectSchema } from './socialPost.validation.js';

const router = Router();
router.use(auth);

const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

// Media upload (must be before /:id)
router.post('/upload', rbac(...SALES_ROLES), upload.single('file'), routeUpload, controller.uploadMedia.bind(controller));

router.get('/stats', rbac(...SALES_ROLES), controller.getStats.bind(controller));
router.get('/calendar', rbac(...SALES_ROLES), controller.getCalendar.bind(controller));
router.get('/', rbac(...SALES_ROLES), controller.getAll.bind(controller));
router.get('/:id', rbac(...SALES_ROLES), controller.getById.bind(controller));

router.post('/', rbac(...SALES_ROLES), validate(createPostSchema), controller.create.bind(controller));
router.patch('/:id', rbac(...SALES_ROLES), validate(updatePostSchema), controller.update.bind(controller));
router.delete('/:id', rbac('super_admin'), controller.delete.bind(controller));

router.post('/:id/submit', rbac(...SALES_ROLES), controller.submit.bind(controller));
router.post('/:id/approve', rbac('super_admin'), controller.approve.bind(controller));
router.post('/:id/reject', rbac('super_admin'), validate(rejectSchema), controller.reject.bind(controller));
router.post('/:id/publish', rbac(...SALES_ROLES), controller.publish.bind(controller));
router.post('/:id/archive', rbac(...SALES_ROLES), controller.archive.bind(controller));

export default router;
