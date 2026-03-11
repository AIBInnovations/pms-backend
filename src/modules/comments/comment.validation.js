import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const createCommentSchema = Joi.object({
  body: Joi.string().trim().max(10000).required(),
  commentableType: Joi.string().valid('Task', 'Bug', 'Project').required(),
  commentableId: objectId.required(),
  mentions: Joi.array().items(Joi.string()),
  parentComment: Joi.string().allow('', null),
});

export const updateCommentSchema = Joi.object({
  body: Joi.string().trim().max(10000).required(),
  mentions: Joi.array().items(Joi.string()).optional(),
});

export const commentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  commentableType: Joi.string().valid('Task', 'Bug', 'Project'),
  commentableId: objectId,
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const reactionSchema = Joi.object({
  emoji: Joi.string().max(2).required(),
});
