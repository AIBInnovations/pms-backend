import { Router } from 'express';
import taskController from './task.controller.js';
import { auth, validate, audit, upload } from '../../middleware/index.js';
import {
  createTaskSchema,
  updateTaskSchema,
  transitionTaskSchema,
  bulkActionSchema,
  taskQuerySchema,
} from './task.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         project:
 *           type: string
 *         assignee:
 *           type: string
 *         status:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         dueDate:
 *           type: string
 *           format: date
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

router.use(auth);

// Task CRUD

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List all tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *         description: Filter by assignee ID
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 */
router.get('/', validate(taskQuerySchema, 'query'), taskController.getAll.bind(taskController));

// Workload (must be before /:id to avoid being caught by it)
router.get('/workload', taskController.getWorkload.bind(taskController));
router.get('/workload/:projectId', taskController.getWorkload.bind(taskController));

// Project-scoped task endpoints
router.get('/project/:projectId', validate(taskQuerySchema, 'query'), taskController.getByProject.bind(taskController));
router.get('/project/:projectId/stats', taskController.getStats.bind(taskController));

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.get('/:id', taskController.getById.bind(taskController));

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, project]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Implement login page
 *               description:
 *                 type: string
 *                 example: Build the login page with email and password fields
 *               project:
 *                 type: string
 *                 description: Project ID
 *               assignee:
 *                 type: string
 *                 description: Assignee user ID
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: '2026-04-01'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/',
  validate(createTaskSchema),
  audit('task'),
  taskController.create.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignee:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               dueDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.patch(
  '/:id',
  validate(updateTaskSchema),
  audit('task'),
  taskController.update.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.delete(
  '/:id',
  audit('task'),
  taskController.delete.bind(taskController)
);

// Stage transition
router.post(
  '/:id/transition',
  validate(transitionTaskSchema),
  audit('task'),
  taskController.transition.bind(taskController)
);

// Subtasks
router.get('/:id/subtasks', taskController.getSubtasks.bind(taskController));

// Attachments
router.post(
  '/:id/attachments',
  upload.single('file'),
  audit('task'),
  taskController.addAttachment.bind(taskController)
);
router.delete(
  '/:id/attachments/:attachmentId',
  audit('task'),
  taskController.removeAttachment.bind(taskController)
);

// Annotated image
router.post(
  '/:id/annotated-image',
  taskController.saveAnnotatedImage.bind(taskController)
);

// Bulk actions
router.post(
  '/bulk',
  validate(bulkActionSchema),
  audit('task'),
  taskController.bulkAction.bind(taskController)
);

export default router;
