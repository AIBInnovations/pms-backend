import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('super_admin', 'project_manager', 'developer').required(),
  designation: Joi.string().trim().max(100).allow(''),
  skills: Joi.array().items(Joi.string().trim()),
  phone: Joi.string().trim().max(20).allow(''),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().max(100),
  designation: Joi.string().trim().max(100).allow(''),
  skills: Joi.array().items(Joi.string().trim()),
  phone: Joi.string().trim().max(20).allow(''),
  avatar: Joi.string().allow(''),
}).min(1);

export const updateRoleSchema = Joi.object({
  role: Joi.string().valid('super_admin', 'project_manager', 'developer').required(),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

export const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  role: Joi.string().valid('super_admin', 'project_manager', 'developer'),
  status: Joi.string().valid('active', 'inactive'),
  sortBy: Joi.string().valid('name', 'email', 'createdAt', 'role').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
