import { Router } from 'express';
import projectController from './project.controller.js';
import { auth, rbac, validate, audit } from '../../middleware/index.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  createMilestoneSchema,
  updateMilestoneSchema,
} from './project.validation.js';

const router = Router();

router.use(auth);

// Projects CRUD
router.get('/', validate(projectQuerySchema, 'query'), projectController.getAll.bind(projectController));
router.get('/:id', projectController.getById.bind(projectController));
router.post(
  '/',
  rbac('super_admin', 'project_manager'),
  validate(createProjectSchema),
  audit('project'),
  projectController.create.bind(projectController)
);
router.patch(
  '/:id',
  rbac('super_admin', 'project_manager'),
  validate(updateProjectSchema),
  audit('project'),
  projectController.update.bind(projectController)
);
router.delete(
  '/:id',
  rbac('super_admin'),
  audit('project'),
  projectController.delete.bind(projectController)
);

// Team
router.get('/:id/team', projectController.getTeam.bind(projectController));

// Milestones (nested under project)
router.get('/:id/milestones', projectController.getMilestones.bind(projectController));
router.post(
  '/:id/milestones',
  rbac('super_admin', 'project_manager'),
  validate(createMilestoneSchema),
  audit('milestone'),
  projectController.createMilestone.bind(projectController)
);
router.patch(
  '/:id/milestones/:milestoneId',
  rbac('super_admin', 'project_manager'),
  validate(updateMilestoneSchema),
  audit('milestone'),
  projectController.updateMilestone.bind(projectController)
);
router.delete(
  '/:id/milestones/:milestoneId',
  rbac('super_admin', 'project_manager'),
  audit('milestone'),
  projectController.deleteMilestone.bind(projectController)
);

export default router;
