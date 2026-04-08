import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const PLATFORMS = ['instagram', 'linkedin', 'twitter'];
const STATUSES = ['idea', 'draft', 'pending_approval', 'scheduled', 'published', 'rejected', 'archived'];

const mediaItem = Joi.object({
  _id: Joi.string(),
  url: Joi.string().uri().required(),
  type: Joi.string().valid('image', 'video', 'other').default('image'),
  name: Joi.string().trim().allow(''),
  size: Joi.number().min(0),
});

export const createPostSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  content: Joi.string().trim().max(5000).required(),
  platforms: Joi.array().items(Joi.string().valid(...PLATFORMS)).min(1).required(),
  media: Joi.array().items(mediaItem).default([]),
  hashtags: Joi.array().items(Joi.string().trim()).default([]),
  link: Joi.string().trim().allow(''),
  scheduledAt: Joi.date().iso().allow(null),
  status: Joi.string().valid('idea', 'draft'),
  assignee: objectId.allow(null, ''),
  campaign: Joi.string().trim().allow(''),
  notes: Joi.string().trim().allow(''),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().trim().max(200),
  content: Joi.string().trim().max(5000),
  platforms: Joi.array().items(Joi.string().valid(...PLATFORMS)).min(1),
  media: Joi.array().items(mediaItem),
  hashtags: Joi.array().items(Joi.string().trim()),
  link: Joi.string().trim().allow(''),
  scheduledAt: Joi.date().iso().allow(null),
  status: Joi.string().valid(...STATUSES),
  assignee: objectId.allow(null, ''),
  campaign: Joi.string().trim().allow(''),
  notes: Joi.string().trim().allow(''),
}).min(1);

export const rejectSchema = Joi.object({
  reason: Joi.string().trim().max(1000).required(),
});
