import service from './portal.service.js';
import { sendSuccess } from '../../utils/index.js';

class PortalController {
  // Admin
  async enablePortal(req, res, next) {
    try { sendSuccess(res, { data: await service.enablePortal(req.params.id) }); } catch (e) { next(e); }
  }
  async disablePortal(req, res, next) {
    try { sendSuccess(res, { data: await service.disablePortal(req.params.id) }); } catch (e) { next(e); }
  }

  // Public
  async login(req, res, next) {
    try {
      const { clientId, token } = req.body;
      sendSuccess(res, { data: await service.login(clientId, token) });
    } catch (e) { next(e); }
  }

  // Portal-authenticated
  async getMe(req, res, next) {
    try { sendSuccess(res, { data: await service.getMe(req.client._id) }); } catch (e) { next(e); }
  }
  async getProjects(req, res, next) {
    try { sendSuccess(res, { data: await service.getProjects(req.client) }); } catch (e) { next(e); }
  }
  async getProposals(req, res, next) {
    try { sendSuccess(res, { data: await service.getProposals(req.client._id) }); } catch (e) { next(e); }
  }
  async getInvoices(req, res, next) {
    try { sendSuccess(res, { data: await service.getInvoices(req.client) }); } catch (e) { next(e); }
  }
}

export default new PortalController();
