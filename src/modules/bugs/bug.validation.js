import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const createBugSchema = Joi.object({
  project: objectId.required(),
  title: Joi.string().trim().max(300).required(),
  description: Joi.string().trim().max(5000).allow(''),
  severity: Joi.string().valid('critical', 'major', 'minor', 'trivial'),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  environment: Joi.string().trim().max(500).allow(''),
  stepsToReproduce: Joi.string().trim().max(5000).allow(''),
  expectedResult: Joi.string().trim().max(2000).allow(''),
  actualResult: Joi.string().trim().max(2000).allow(''),
  assignee: Joi.string().allow('', null),
  relatedTask: Joi.string().allow('', null),
  dueDate: Joi.date().iso().allow(null),
});

export const updateBugSchema = Joi.object({
  title: Joi.string().trim().max(300),
  description: Joi.string().trim().max(5000).allow(''),
  severity: Joi.string().valid('critical', 'major', 'minor', 'trivial'),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  environment: Joi.string().trim().max(500).allow(''),
  stepsToReproduce: Joi.string().trim().max(5000).allow(''),
  expectedResult: Joi.string().trim().max(2000).allow(''),
  actualResult: Joi.string().trim().max(2000).allow(''),
  assignee: Joi.string().allow('', null),
  relatedTask: Joi.string().allow('', null),
  dueDate: Joi.date().iso().allow(null),
}).min(1);

export const transitionBugSchema = Joi.object({
  status: Joi.string()
    .valid('open', 'in_progress', 'fixed', 'verified', 'closed', 'reopened', 'wont_fix')
    .required(),
});

export const bugQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  project: objectId,
  severity: Joi.string().valid('critical', 'major', 'minor', 'trivial'),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  status: Joi.string().valid('open', 'in_progress', 'fixed', 'verified', 'closed', 'reopened', 'wont_fix'),
  assignee: objectId,
  reporter: objectId,
  sortBy: Joi.string().valid('title', 'createdAt', 'severity', 'priority', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
