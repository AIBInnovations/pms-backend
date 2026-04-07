import proposalService from './proposal.service.js';
import { sendSuccess } from '../../utils/index.js';

class ProposalController {
  async getAll(req, res, next) {
    try {
      const data = await proposalService.getAll(req.query);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const data = await proposalService.getById(req.params.id);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const data = await proposalService.create(req.body, req.user.id || req.user._id);
      sendSuccess(res, { data, message: 'Proposal created' }, 201);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const data = await proposalService.update(req.params.id, req.body, req.user.id || req.user._id);
      sendSuccess(res, { data, message: 'Proposal updated' });
    } catch (e) { next(e); }
  }

  async updateStatus(req, res, next) {
    try {
      const data = await proposalService.updateStatus(req.params.id, req.body.status, req.body.rejectionReason);
      sendSuccess(res, { data, message: 'Status updated' });
    } catch (e) { next(e); }
  }

  async duplicate(req, res, next) {
    try {
      const data = await proposalService.duplicate(req.params.id, req.user.id || req.user._id);
      sendSuccess(res, { data, message: 'Proposal duplicated' }, 201);
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try {
      await proposalService.delete(req.params.id);
      sendSuccess(res, { message: 'Proposal deleted' });
    } catch (e) { next(e); }
  }

  async getTemplates(req, res, next) {
    try {
      const data = await proposalService.getTemplates();
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }
}

export default new ProposalController();
