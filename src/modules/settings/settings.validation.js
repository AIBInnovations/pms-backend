import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
  appName: Joi.string().max(100),
  logo: Joi.string().allow(''),
  defaultProjectType: Joi.string().valid('fixed_cost', 'time_and_material', 'retainer'),
  defaultTaskPriority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  maxFileSize: Joi.number().min(1).max(100),
  allowedFileTypes: Joi.array().items(Joi.string()),
  maintenanceMode: Joi.boolean(),
}).min(1);
