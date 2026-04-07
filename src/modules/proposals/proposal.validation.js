import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const lineItemSchema = Joi.object({
  _id: Joi.string(),
  description: Joi.string().trim().required(),
  quantity: Joi.number().min(0).default(1),
  unitPrice: Joi.number().min(0).default(0),
  type: Joi.string().valid('one_time', 'recurring').default('one_time'),
});

const paymentMilestoneSchema = Joi.object({
  _id: Joi.string(),
  label: Joi.string().trim().required(),
  percentage: Joi.number().min(0).max(100).allow(null),
  amount: Joi.number().min(0).allow(null),
  dueOn: Joi.string().allow(''),
});

export const createProposalSchema = Joi.object({
  lead: objectId.allow(null, ''),
  client: objectId.allow(null, ''),
  title: Joi.string().trim().max(300).required(),
  summary: Joi.string().trim().allow(''),
  lineItems: Joi.array().items(lineItemSchema).default([]),
  discountType: Joi.string().valid('percentage', 'fixed', 'none').default('none'),
  discountValue: Joi.number().min(0).default(0),
  paymentTerms: Joi.array().items(paymentMilestoneSchema).default([]),
  validityDate: Joi.date().iso().allow(null, ''),
  notes: Joi.string().trim().allow(''),
  isTemplate: Joi.boolean(),
  templateName: Joi.string().trim().allow(''),
});

export const updateProposalSchema = Joi.object({
  lead: objectId.allow(null, ''),
  client: objectId.allow(null, ''),
  title: Joi.string().trim().max(300),
  summary: Joi.string().trim().allow(''),
  lineItems: Joi.array().items(lineItemSchema),
  discountType: Joi.string().valid('percentage', 'fixed', 'none'),
  discountValue: Joi.number().min(0),
  paymentTerms: Joi.array().items(paymentMilestoneSchema),
  validityDate: Joi.date().iso().allow(null, ''),
  notes: Joi.string().trim().allow(''),
  revisionNote: Joi.string().trim().allow(''),
  isTemplate: Joi.boolean(),
  templateName: Joi.string().trim().allow(''),
}).min(1);

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'viewed', 'accepted', 'rejected').required(),
  rejectionReason: Joi.string().trim().allow(''),
});
