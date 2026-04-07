import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const contactSchema = Joi.object({
  _id: Joi.string(),
  name: Joi.string().trim().required(),
  role: Joi.string().trim().allow(''),
  email: Joi.string().email().lowercase().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  isPrimary: Joi.boolean(),
});

const importantDateSchema = Joi.object({
  _id: Joi.string(),
  label: Joi.string().trim().required(),
  date: Joi.date().iso().required(),
  notes: Joi.string().trim().allow(''),
});

export const createClientSchema = Joi.object({
  company: Joi.string().trim().max(200).required(),
  contacts: Joi.array().items(contactSchema).default([]),
  source: Joi.string().trim().allow(''),
  clientSince: Joi.date().iso().allow(null),
  status: Joi.string().valid('prospect', 'active', 'on_hold', 'churned'),
  tags: Joi.array().items(Joi.string().trim()),
  importantDates: Joi.array().items(importantDateSchema),
  sourceLead: objectId.allow(null, ''),
});

export const updateClientSchema = Joi.object({
  company: Joi.string().trim().max(200),
  contacts: Joi.array().items(contactSchema),
  source: Joi.string().trim().allow(''),
  clientSince: Joi.date().iso().allow(null),
  status: Joi.string().valid('prospect', 'active', 'on_hold', 'churned'),
  tags: Joi.array().items(Joi.string().trim()),
  importantDates: Joi.array().items(importantDateSchema),
  churnReason: Joi.string().trim().allow(''),
  churnDate: Joi.date().iso().allow(null),
}).min(1);

export const noteSchema = Joi.object({
  text: Joi.string().trim().max(2000).required(),
});
