import Joi from 'joi';

const TYPES = ['call', 'email', 'meeting', 'whatsapp', 'demo', 'proposal_discussion', 'negotiation', 'check_in', 'other'];
const OUTCOMES = ['interested', 'not_interested', 'followup_needed', 'closed', ''];

export const createActivitySchema = Joi.object({
  type: Joi.string().valid(...TYPES).required(),
  outcome: Joi.string().valid(...OUTCOMES).allow(''),
  notes: Joi.string().trim().max(5000).allow(''),
  nextAction: Joi.string().trim().max(500).allow(''),
  nextActionDate: Joi.date().iso().allow(null, ''),
  completed: Joi.boolean(),
});

export const updateActivitySchema = Joi.object({
  type: Joi.string().valid(...TYPES),
  outcome: Joi.string().valid(...OUTCOMES).allow(''),
  notes: Joi.string().trim().max(5000).allow(''),
  nextAction: Joi.string().trim().max(500).allow(''),
  nextActionDate: Joi.date().iso().allow(null, ''),
  completed: Joi.boolean(),
}).min(1);
