import { Router } from 'express';
import bugController from './bug.controller.js';
import { auth, validate, audit, rbac } from '../../middleware/index.js';
import {
  createBugSchema,
  updateBugSchema,
  transitionBugSchema,
  bugQuerySchema,
} from './bug.validation.js';

const router = Router();

router.use(auth);

// Stats (specific paths before :id)
router.get('/stats', bugController.getStats.bind(bugController));

// Project-scoped endpoints
router.get(
  '/project/:projectId',
  validate(bugQuerySchema, 'query'),
  bugController.getByProject.bind(bugController)
);
router.get('/project/:projectId/stats', bugController.getStatsByProject.bind(bugController));

// Task-linked bugs
router.get('/task/:taskId', bugController.getLinkedBugs.bind(bugController));

// Bug CRUD
router.get('/', validate(bugQuerySchema, 'query'), bugController.getAll.bind(bugController));
router.get('/:id', bugController.getById.bind(bugController));
router.post(
  '/',
  validate(createBugSchema),
  audit('bugs'),
  bugController.create.bind(bugController)
);
router.patch(
  '/:id',
  validate(updateBugSchema),
  audit('bugs'),
  bugController.update.bind(bugController)
);

// Status transition
router.post(
  '/:id/transition',
  validate(transitionBugSchema),
  audit('bugs'),
  bugController.transition.bind(bugController)
);

// Delete (restricted)
router.delete(
  '/:id',
  rbac('super_admin', 'project_manager'),
  audit('bugs'),
  bugController.delete.bind(bugController)
);

export default router;
