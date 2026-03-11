import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('super_admin', 'project_manager', 'developer'),
  designation: Joi.string().trim().max(100).allow(''),
  skills: Joi.array().items(Joi.string().trim()),
  phone: Joi.string().trim().max(20).allow(''),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(128).required(),
});

export const forceResetPasswordSchema = Joi.object({
  password: Joi.string().min(8).max(128).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
