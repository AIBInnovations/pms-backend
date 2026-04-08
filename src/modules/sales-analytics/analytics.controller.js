import service from './analytics.service.js';
import { sendSuccess } from '../../utils/index.js';

class SalesAnalyticsController {
  async getOverview(req, res, next) {
    try { sendSuccess(res, { data: await service.getOverview(req.query) }); } catch (e) { next(e); }
  }
  async getFunnel(req, res, next) {
    try { sendSuccess(res, { data: await service.getFunnel(req.query) }); } catch (e) { next(e); }
  }
  async getRevenueTrend(req, res, next) {
    try { sendSuccess(res, { data: await service.getRevenueTrend(req.query) }); } catch (e) { next(e); }
  }
  async getWonLost(req, res, next) {
    try { sendSuccess(res, { data: await service.getWonLost(req.query) }); } catch (e) { next(e); }
  }
  async getSourceReport(req, res, next) {
    try { sendSuccess(res, { data: await service.getSourceReport(req.query) }); } catch (e) { next(e); }
  }
  async getPipelineBreakdown(req, res, next) {
    try { sendSuccess(res, { data: await service.getPipelineBreakdown(req.query) }); } catch (e) { next(e); }
  }
}

export default new SalesAnalyticsController();
