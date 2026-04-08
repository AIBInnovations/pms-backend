import { Router } from 'express';
import controller from './proposal.controller.js';
import { auth, rbac, validate } from '../../middleware/index.js';
import { createProposalSchema, updateProposalSchema, updateStatusSchema } from './proposal.validation.js';

const router = Router();
router.use(auth);

const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

router.get('/templates', rbac(...SALES_ROLES), controller.getTemplates.bind(controller));
router.get('/', rbac(...SALES_ROLES), controller.getAll.bind(controller));
router.get('/:id', rbac(...SALES_ROLES), controller.getById.bind(controller));
router.post('/', rbac(...SALES_ROLES), validate(createProposalSchema), controller.create.bind(controller));
router.patch('/:id', rbac(...SALES_ROLES), validate(updateProposalSchema), controller.update.bind(controller));
router.patch('/:id/status', rbac(...SALES_ROLES), validate(updateStatusSchema), controller.updateStatus.bind(controller));
router.post('/:id/duplicate', rbac(...SALES_ROLES), controller.duplicate.bind(controller));
router.get('/:id/pdf', rbac(...SALES_ROLES), controller.exportPdf.bind(controller));
router.post('/:id/send', rbac(...SALES_ROLES), controller.sendEmail.bind(controller));
router.delete('/:id', rbac('super_admin'), controller.delete.bind(controller));

export default router;
