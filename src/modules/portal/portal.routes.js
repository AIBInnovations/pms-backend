import { Router } from 'express';
import controller from './portal.controller.js';
import { auth, rbac } from '../../middleware/index.js';
import portalAuth from './portalAuth.middleware.js';

const router = Router();

// Public — client login
router.post('/auth/login', controller.login.bind(controller));

// Admin — enable / disable portal access for a client
router.post('/clients/:id/enable', auth, rbac('super_admin'), controller.enablePortal.bind(controller));
router.post('/clients/:id/disable', auth, rbac('super_admin'), controller.disablePortal.bind(controller));

// Portal-authenticated (client JWT)
router.get('/me', portalAuth, controller.getMe.bind(controller));
router.get('/projects', portalAuth, controller.getProjects.bind(controller));
router.get('/proposals', portalAuth, controller.getProposals.bind(controller));
router.get('/invoices', portalAuth, controller.getInvoices.bind(controller));

export default router;
