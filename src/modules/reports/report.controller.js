import reportService from './report.service.js';
import { sendSuccess } from '../../utils/index.js';

class ReportController {
  async projectProgress(req, res, next) {
    try {
      const data = await reportService.projectProgress(req.query.project || req.params.projectId);
      sendSuccess(res, { data });
    } catch (error) { next(error); }
  }

  async bugSummary(req, res, next) {
    try {
      const data = await reportService.bugSummary(req.validQuery || req.query);
      sendSuccess(res, { data });
    } catch (error) { next(error); }
  }

  async developerAnalytics(req, res, next) {
    try {
      const data = await reportService.developerAnalytics(req.validQuery || req.query);
      sendSuccess(res, { data });
    } catch (error) { next(error); }
  }

  async orgOverview(req, res, next) {
    try {
      const data = await reportService.orgOverview();
      sendSuccess(res, { data });
    } catch (error) { next(error); }
  }

  async exportCSV(req, res, next) {
    try {
      const { type } = req.params;
      const csv = await reportService.exportCSV(type, req.validQuery || req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send(csv);
    } catch (error) { next(error); }
  }
}

export default new ReportController();
