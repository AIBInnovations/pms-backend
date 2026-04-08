import { Router } from 'express';
import controller from './analytics.controller.js';
import { auth, rbac } from '../../middleware/index.js';

const router = Router();
router.use(auth);

const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

router.get('/overview', rbac(...SALES_ROLES), controller.getOverview.bind(controller));
router.get('/funnel', rbac(...SALES_ROLES), controller.getFunnel.bind(controller));
router.get('/revenue-trend', rbac(...SALES_ROLES), controller.getRevenueTrend.bind(controller));
router.get('/won-lost', rbac(...SALES_ROLES), controller.getWonLost.bind(controller));
router.get('/sources', rbac(...SALES_ROLES), controller.getSourceReport.bind(controller));
router.get('/pipeline-breakdown', rbac(...SALES_ROLES), controller.getPipelineBreakdown.bind(controller));

export default router;
