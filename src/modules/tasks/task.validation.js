import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const createTaskSchema = Joi.object({
  project: objectId.required(),
  title: Joi.string().trim().max(300).required(),
  description: Joi.string().trim().max(5000).allow(''),
  type: Joi.string().valid('feature', 'bug', 'improvement', 'research', 'deployment'),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  stage: Joi.string().valid('backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done'),
  assignees: Joi.array().items(objectId).default([]),
  watchers: Joi.array().items(objectId).default([]),
  dueDate: Joi.date().iso().allow(null),
  estimatedHours: Joi.number().min(0),
  parentTask: objectId.allow(null),
  milestone: objectId.allow(null),
  checklists: Joi.array().items(
    Joi.object({
      text: Joi.string().trim().required(),
      checked: Joi.boolean().default(false),
    })
  ),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().max(300),
  description: Joi.string().trim().max(5000).allow(''),
  type: Joi.string().valid('feature', 'bug', 'improvement', 'research', 'deployment'),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  assignees: Joi.array().items(objectId),
  watchers: Joi.array().items(objectId),
  dueDate: Joi.date().iso().allow(null),
  estimatedHours: Joi.number().min(0),
  progress: Joi.number().min(0).max(100),
  isBlocked: Joi.boolean(),
  blockedReason: Joi.string().trim().allow(''),
  parentTask: objectId.allow(null),
  milestone: objectId.allow(null),
  checklists: Joi.array().items(
    Joi.object({
      _id: Joi.string(),
      text: Joi.string().trim().required(),
      checked: Joi.boolean().default(false),
    })
  ),
}).min(1);

export const transitionTaskSchema = Joi.object({
  stage: Joi.string()
    .valid('backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'archived')
    .required(),
});

export const bulkActionSchema = Joi.object({
  taskIds: Joi.array().items(objectId).min(1).required(),
  action: Joi.string().valid('reassign', 'change_priority', 'change_stage', 'archive').required(),
  value: Joi.alternatives().conditional('action', {
    switch: [
      { is: 'reassign', then: Joi.array().items(objectId).min(1).required() },
      { is: 'change_priority', then: Joi.string().valid('critical', 'high', 'medium', 'low').required() },
      { is: 'change_stage', then: Joi.string().valid('backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'archived').required() },
      { is: 'archive', then: Joi.any().strip() },
    ],
  }),
});

export const taskQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  search: Joi.string().trim().allow(''),
  project: objectId,
  type: Joi.string().valid('feature', 'bug', 'improvement', 'research', 'deployment'),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  stage: Joi.string().valid('backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'archived'),
  assignee: objectId,
  parentTask: Joi.string().allow('null', ''),
  sortBy: Joi.string().valid('title', 'createdAt', 'dueDate', 'priority', 'stage').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
