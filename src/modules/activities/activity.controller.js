import activityService from './activity.service.js';
import { sendSuccess } from '../../utils/index.js';

class ActivityController {
  async getByLead(req, res, next) {
    try {
      const data = await activityService.getByLead(req.params.leadId);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const activity = await activityService.create(req.params.leadId, req.body, req.user.id || req.user._id);
      sendSuccess(res, { data: activity, message: 'Activity logged' }, 201);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const activity = await activityService.update(req.params.id, req.body);
      sendSuccess(res, { data: activity, message: 'Activity updated' });
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try {
      await activityService.delete(req.params.id);
      sendSuccess(res, { message: 'Activity deleted' });
    } catch (e) { next(e); }
  }

  async getUpcoming(req, res, next) {
    try {
      const data = await activityService.getUpcoming(req.user.id || req.user._id, req.user.role);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async getOverdue(req, res, next) {
    try {
      const data = await activityService.getOverdue(req.user.id || req.user._id, req.user.role);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }
}

export default new ActivityController();
