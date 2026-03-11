import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const createDocumentSchema = Joi.object({
  project: objectId.required(),
  title: Joi.string().trim().max(300).required(),
  content: Joi.string().max(500000).allow(''),
  category: Joi.string().valid('requirement', 'design', 'technical', 'meeting_notes', 'guide', 'other'),
  tags: Joi.array().items(Joi.string().trim()).max(20),
});

export const updateDocumentSchema = Joi.object({
  title: Joi.string().trim().max(300),
  content: Joi.string().max(500000).allow(''),
  category: Joi.string().valid('requirement', 'design', 'technical', 'meeting_notes', 'guide', 'other'),
  tags: Joi.array().items(Joi.string().trim()).max(20),
}).min(1);

export const documentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  project: objectId,
  category: Joi.string().valid('requirement', 'design', 'technical', 'meeting_notes', 'guide', 'other'),
  tag: Joi.string().trim(),
  search: Joi.string().trim().allow(''),
  sortBy: Joi.string().valid('title', 'createdAt', 'updatedAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
