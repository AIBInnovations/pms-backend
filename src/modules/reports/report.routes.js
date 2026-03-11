import { Router } from 'express';
import reportController from './report.controller.js';
import { auth, validate, rbac } from '../../middleware/index.js';
import { reportQuerySchema } from './report.validation.js';

const router = Router();
router.use(auth);
router.use(rbac('super_admin', 'project_manager'));

router.get('/project-progress', validate(reportQuerySchema, 'query'), reportController.projectProgress.bind(reportController));
router.get('/project-progress/:projectId', reportController.projectProgress.bind(reportController));
router.get('/bug-summary', validate(reportQuerySchema, 'query'), reportController.bugSummary.bind(reportController));
router.get('/developer-analytics', validate(reportQuerySchema, 'query'), reportController.developerAnalytics.bind(reportController));
router.get('/export/:type', validate(reportQuerySchema, 'query'), reportController.exportCSV.bind(reportController));

export default router;
