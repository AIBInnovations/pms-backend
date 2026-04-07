import { Router } from 'express';
import controller from './client.controller.js';
import { auth, rbac, validate } from '../../middleware/index.js';
import { createClientSchema, updateClientSchema, noteSchema } from './client.validation.js';

const router = Router();
router.use(auth);

const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

router.get('/', rbac(...SALES_ROLES), controller.getAll.bind(controller));
router.get('/:id', rbac(...SALES_ROLES), controller.getById.bind(controller));
router.post('/', rbac(...SALES_ROLES), validate(createClientSchema), controller.create.bind(controller));
router.patch('/:id', rbac(...SALES_ROLES), validate(updateClientSchema), controller.update.bind(controller));
router.delete('/:id', rbac('super_admin'), controller.delete.bind(controller));

router.post('/:id/notes', rbac(...SALES_ROLES), validate(noteSchema), controller.addNote.bind(controller));
router.delete('/:id/notes/:noteId', rbac(...SALES_ROLES), controller.deleteNote.bind(controller));

export default router;
