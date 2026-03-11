import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const reportQuerySchema = Joi.object({
  project: objectId,
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  groupBy: Joi.string().trim(),
});
