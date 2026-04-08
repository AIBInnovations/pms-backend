import { Router } from 'express';
import controller from './target.controller.js';
import { auth, rbac } from '../../middleware/index.js';

const router = Router();
router.use(auth);

const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

// Read endpoints (anyone in sales)
router.get('/leaderboard', rbac(...SALES_ROLES), controller.getLeaderboard.bind(controller));
router.get('/current', rbac(...SALES_ROLES), controller.getCurrent.bind(controller));
router.get('/', rbac(...SALES_ROLES), controller.getAll.bind(controller));
router.get('/:id/progress', rbac(...SALES_ROLES), controller.getProgress.bind(controller));

// Write endpoints (admin only — only firm-wide / individual targets are set by admin)
router.post('/', rbac('super_admin'), controller.create.bind(controller));
router.patch('/:id', rbac('super_admin'), controller.update.bind(controller));
router.delete('/:id', rbac('super_admin'), controller.delete.bind(controller));

export default router;
