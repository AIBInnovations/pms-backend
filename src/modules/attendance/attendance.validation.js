import Joi from 'joi';

export const checkInSchema = Joi.object({
  networkName: Joi.string().trim().allow(''),
  notes: Joi.string().trim().max(500).allow(''),
});

export const checkOutSchema = Joi.object({
  notes: Joi.string().trim().max(500).allow(''),
});

export const attendanceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(31),
  month: Joi.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export const registerIpSchema = Joi.object({
  userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  ip: Joi.string().trim().required(),
});
