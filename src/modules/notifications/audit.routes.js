import { Router } from 'express';
import auditController from './audit.controller.js';
import { auth, rbac } from '../../middleware/index.js';

const router = Router();

router.use(auth);
router.use(rbac('super_admin'));

router.get('/', auditController.getAll.bind(auditController));

export default router;
