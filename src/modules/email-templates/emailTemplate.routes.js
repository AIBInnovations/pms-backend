import { Router } from 'express';
import EmailTemplate from './emailTemplate.model.js';
import { auth, rbac } from '../../middleware/index.js';
import { sendSuccess, AppError } from '../../utils/index.js';

const router = Router();
router.use(auth);

const SALES_ROLES = ['super_admin', 'project_manager', 'sales_executive'];

router.get('/', rbac(...SALES_ROLES), async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find().sort({ category: 1, name: 1 });
    sendSuccess(res, { data: templates });
  } catch (e) { next(e); }
});

router.post('/', rbac(...SALES_ROLES), async (req, res, next) => {
  try {
    const { name, category, subject, body, variables } = req.body;
    if (!name || !subject || !body) throw new AppError('Name, subject and body required', 400);
    const template = await EmailTemplate.create({
      name, category, subject, body, variables,
      createdBy: req.user.id || req.user._id,
    });
    sendSuccess(res, { data: template, message: 'Template created' }, 201);
  } catch (e) { next(e); }
});

router.patch('/:id', rbac(...SALES_ROLES), async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) throw new AppError('Template not found', 404);
    sendSuccess(res, { data: template, message: 'Template updated' });
  } catch (e) { next(e); }
});

router.delete('/:id', rbac(...SALES_ROLES), async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) throw new AppError('Template not found', 404);
    sendSuccess(res, { message: 'Template deleted' });
  } catch (e) { next(e); }
});

export default router;
