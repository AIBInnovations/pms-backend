import targetService from './target.service.js';
import { sendSuccess } from '../../utils/index.js';

class TargetController {
  async getAll(req, res, next) {
    try {
      const data = await targetService.getAll(req.query);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const data = await targetService.create(req.body, req.user.id || req.user._id);
      sendSuccess(res, { data, message: 'Target created' }, 201);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const data = await targetService.update(req.params.id, req.body);
      sendSuccess(res, { data, message: 'Target updated' });
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try {
      await targetService.delete(req.params.id);
      sendSuccess(res, { message: 'Target deleted' });
    } catch (e) { next(e); }
  }

  async getProgress(req, res, next) {
    try {
      const data = await targetService.getProgressById(req.params.id);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async getCurrent(req, res, next) {
    try {
      const data = await targetService.getCurrentWithProgress();
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async getLeaderboard(req, res, next) {
    try {
      const periodKey = req.query.periodKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const data = await targetService.getLeaderboard(periodKey);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }
}

export default new TargetController();
