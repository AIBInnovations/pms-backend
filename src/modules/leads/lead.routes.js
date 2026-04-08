import { Router } from 'express';
import controller from './lead.controller.js';
import { auth, rbac, validate, audit } from '../../middleware/index.js';
import { createLeadSchema, updateLeadSchema, leadQuerySchema, noteSchema } from './lead.validation.js';

const router = Router();

router.use(auth);

// Sales Executives + PMs + Admin can manage leads
const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

router.get('/check-duplicate', rbac(...SALES_ROLES), controller.checkDuplicate.bind(controller));
router.get('/', rbac(...SALES_ROLES), validate(leadQuerySchema, 'query'), controller.getAll.bind(controller));
router.get('/:id', rbac(...SALES_ROLES), controller.getById.bind(controller));

router.post('/', rbac(...SALES_ROLES), validate(createLeadSchema), audit('lead'), controller.create.bind(controller));
router.patch('/:id', rbac(...SALES_ROLES), validate(updateLeadSchema), audit('lead'), controller.update.bind(controller));

// Only Admin can delete
router.delete('/:id', rbac('super_admin'), audit('lead'), controller.delete.bind(controller));

// Convert to project
router.post('/:id/convert-to-project', rbac(...SALES_ROLES), controller.convertToProject.bind(controller));

// Internal notes
router.post('/:id/notes', rbac(...SALES_ROLES), validate(noteSchema), controller.addNote.bind(controller));
router.delete('/:id/notes/:noteId', rbac(...SALES_ROLES), controller.deleteNote.bind(controller));

export default router;
