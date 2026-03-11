import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const validDomains = [
  'coded_website_static', 'coded_web_app', 'coded_software_system', 'coded_app',
  'shopify', 'wordpress', 'ai_development', 'automation', 'blockchain',
  'ecommerce', 'api_integration', 'cloud_infrastructure', 'ui_ux_design',
  'data_analytics', 'devops', 'cyber_security',
];

const githubLinkSchema = Joi.object({
  _id: Joi.string(),
  label: Joi.string().trim().max(100).allow(''),
  url: Joi.string().trim().uri().required(),
});

export const createProjectSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(2000).allow(''),
  type: Joi.string().valid('fixed_cost', 'time_and_material', 'retainer').required(),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed'),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
  budget: Joi.number().min(0),
  projectManager: objectId.required(),
  developers: Joi.array().items(objectId).default([]),
  githubLinks: Joi.array().items(githubLinkSchema).default([]),
  domains: Joi.array().items(Joi.string().valid(...validDomains)).default([]),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().trim().max(200),
  description: Joi.string().trim().max(2000).allow(''),
  type: Joi.string().valid('fixed_cost', 'time_and_material', 'retainer'),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed'),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  budget: Joi.number().min(0),
  projectManager: objectId,
  developers: Joi.array().items(objectId),
  githubLinks: Joi.array().items(githubLinkSchema),
  domains: Joi.array().items(Joi.string().valid(...validDomains)),
  stageRestrictions: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())),
}).min(1);

export const projectQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  type: Joi.string().valid('fixed_cost', 'time_and_material', 'retainer'),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed'),
  domain: Joi.string().valid(...validDomains),
  sortBy: Joi.string().valid('name', 'createdAt', 'startDate', 'endDate', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const createMilestoneSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(1000).allow(''),
  dueDate: Joi.date().iso().allow(null),
  status: Joi.string().valid('pending', 'in_progress', 'completed'),
});

export const updateMilestoneSchema = Joi.object({
  title: Joi.string().trim().max(200),
  description: Joi.string().trim().max(1000).allow(''),
  dueDate: Joi.date().iso().allow(null),
  status: Joi.string().valid('pending', 'in_progress', 'completed'),
}).min(1);
