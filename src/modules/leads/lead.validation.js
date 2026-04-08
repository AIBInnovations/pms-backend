import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const SOURCES = ['website', 'email', 'referral', 'cold_outreach', 'social', 'event', 'other'];
const STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'];
const PIPELINES = ['new_business', 'upsell', 'renewal', 'partnership'];
const BUDGETS = ['under_50k', '50k_2l', '2l_10l', 'above_10l', ''];
const SERVICES = ['web_app', 'mobile_app', 'shopify', 'ai', 'automation', 'other'];
const LOST_REASONS = ['price', 'timeline', 'no_response', 'chose_competitor', 'other', ''];

export const createLeadSchema = Joi.object({
  company: Joi.string().trim().max(200).allow(''),
  contactName: Joi.string().trim().max(200).required(),
  email: Joi.string().email().lowercase().trim().allow(''),
  phone: Joi.string().trim().max(30).allow(''),
  source: Joi.string().valid(...SOURCES),
  status: Joi.string().valid(...STATUSES),
  pipeline: Joi.string().valid(...PIPELINES),
  assignee: objectId.allow(null, ''),
  budgetRange: Joi.string().valid(...BUDGETS).allow(''),
  dealValue: Joi.number().min(0),
  serviceInterest: Joi.array().items(Joi.string().valid(...SERVICES)),
  priority: Joi.boolean(),
  leadScore: Joi.number().min(0).max(100),
  tags: Joi.array().items(Joi.string().trim()),
  description: Joi.string().trim().max(5000).allow(''),
  nextFollowUpAt: Joi.date().iso().allow(null, ''),
  postLink: Joi.string().trim().max(1000).allow(''),
  conversationLink: Joi.string().trim().max(1000).allow(''),
  proposalNote: Joi.string().trim().max(5000).allow(''),
});

export const updateLeadSchema = Joi.object({
  company: Joi.string().trim().max(200).allow(''),
  contactName: Joi.string().trim().max(200),
  email: Joi.string().email().lowercase().trim().allow(''),
  phone: Joi.string().trim().max(30).allow(''),
  source: Joi.string().valid(...SOURCES),
  status: Joi.string().valid(...STATUSES),
  pipeline: Joi.string().valid(...PIPELINES),
  assignee: objectId.allow(null, ''),
  budgetRange: Joi.string().valid(...BUDGETS).allow(''),
  dealValue: Joi.number().min(0),
  serviceInterest: Joi.array().items(Joi.string().valid(...SERVICES)),
  priority: Joi.boolean(),
  leadScore: Joi.number().min(0).max(100),
  tags: Joi.array().items(Joi.string().trim()),
  description: Joi.string().trim().max(5000).allow(''),
  lostReason: Joi.string().valid(...LOST_REASONS).allow(''),
  lostReasonNote: Joi.string().trim().max(2000).allow(''),
  nextFollowUpAt: Joi.date().iso().allow(null, ''),
  postLink: Joi.string().trim().max(1000).allow(''),
  conversationLink: Joi.string().trim().max(1000).allow(''),
  proposalNote: Joi.string().trim().max(5000).allow(''),
}).min(1);

export const leadQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid(...STATUSES, ''),
  pipeline: Joi.string().valid(...PIPELINES, ''),
  assignee: objectId.allow(''),
  source: Joi.string().valid(...SOURCES, ''),
  budgetRange: Joi.string().valid(...BUDGETS).allow(''),
  priority: Joi.boolean(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'company', 'contactName', 'dealValue').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const noteSchema = Joi.object({
  text: Joi.string().trim().max(2000).required(),
});
