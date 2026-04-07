import { Router } from 'express';
import controller from './activity.controller.js';
import { auth, rbac, validate } from '../../middleware/index.js';
import { createActivitySchema, updateActivitySchema } from './activity.validation.js';

const router = Router();
router.use(auth);

const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

// Lead-scoped
router.get('/leads/:leadId/activities', rbac(...SALES_ROLES), controller.getByLead.bind(controller));
router.post('/leads/:leadId/activities', rbac(...SALES_ROLES), validate(createActivitySchema), controller.create.bind(controller));

// Activity-scoped
router.patch('/activities/:id', rbac(...SALES_ROLES), validate(updateActivitySchema), controller.update.bind(controller));
router.delete('/activities/:id', rbac(...SALES_ROLES), controller.delete.bind(controller));

// Dashboards
router.get('/activities/upcoming', rbac(...SALES_ROLES), controller.getUpcoming.bind(controller));
router.get('/activities/overdue', rbac(...SALES_ROLES), controller.getOverdue.bind(controller));

export default router;
