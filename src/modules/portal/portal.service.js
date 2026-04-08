import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Client from '../clients/client.model.js';
import Project from '../projects/project.model.js';
import Proposal from '../proposals/proposal.model.js';
import { Invoice } from '../accounts/accounts.model.js';
import { env } from '../../config/index.js';
import { AppError } from '../../utils/index.js';

const PORTAL_TOKEN_LIFE = '7d';

class PortalService {
  // Admin: enable portal & generate access token
  async enablePortal(clientId) {
    const token = crypto.randomBytes(24).toString('hex');
    const client = await Client.findByIdAndUpdate(
      clientId,
      { portalEnabled: true, portalToken: token },
      { new: true }
    ).select('+portalToken');
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return { client, accessUrl: `/portal/login?clientId=${client.clientId}&token=${token}` };
  }

  async disablePortal(clientId) {
    const client = await Client.findByIdAndUpdate(
      clientId,
      { portalEnabled: false, portalToken: null },
      { new: true }
    );
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return client;
  }

  // Public: exchange clientId+token for JWT
  async login(clientIdStr, token) {
    if (!clientIdStr || !token) throw new AppError('Credentials required', 400, 'BAD_REQUEST');
    const client = await Client.findOne({ clientId: clientIdStr, portalEnabled: true }).select('+portalToken');
    if (!client || client.portalToken !== token) {
      throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }
    client.portalLastLogin = new Date();
    await client.save();

    const portalToken = jwt.sign(
      { sub: client._id.toString(), kind: 'portal', clientId: client.clientId },
      env.jwt.accessSecret,
      { expiresIn: PORTAL_TOKEN_LIFE }
    );
    return {
      token: portalToken,
      client: { _id: client._id, clientId: client.clientId, company: client.company },
    };
  }

  // Get client's projects (via sourceLead → linkedLead)
  async getProjects(client) {
    if (!client.sourceLead) return [];
    return Project.find({ linkedLead: client.sourceLead })
      .select('code name status type startDate endDate domains description')
      .sort({ createdAt: -1 });
  }

  async getProposals(clientId) {
    return Proposal.find({ client: clientId, status: { $in: ['sent', 'viewed', 'accepted', 'rejected'] } })
      .select('proposalNumber title status sentAt validityDate lineItems discountType discountValue version')
      .sort({ createdAt: -1 });
  }

  async getInvoices(client) {
    if (!client.sourceLead) return [];
    const projects = await Project.find({ linkedLead: client.sourceLead }).select('_id code name');
    const projectIds = projects.map((p) => p._id);
    const invoices = await Invoice.find({ project: { $in: projectIds } })
      .populate('project', 'code name')
      .sort({ createdAt: -1 });
    return invoices;
  }

  async getMe(clientId) {
    const client = await Client.findById(clientId).select('clientId company contacts status clientSince');
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return client;
  }
}

export default new PortalService();
