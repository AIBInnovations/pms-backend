import Proposal from './proposal.model.js';
import { AppError } from '../../utils/index.js';

class ProposalService {
  async getAll(query = {}) {
    const { search, status, lead, client, isTemplate } = query;
    const conditions = [];

    if (search) {
      conditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { proposalNumber: { $regex: search, $options: 'i' } },
        ],
      });
    }
    if (status) conditions.push({ status });
    if (lead) conditions.push({ lead });
    if (client) conditions.push({ client });
    if (isTemplate !== undefined) conditions.push({ isTemplate });
    else conditions.push({ isTemplate: { $ne: true } }); // exclude templates by default

    const filter = conditions.length > 0 ? { $and: conditions } : {};
    return Proposal.find(filter)
      .populate('lead', 'leadId contactName company')
      .populate('client', 'clientId company')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async getById(id) {
    const proposal = await Proposal.findById(id)
      .populate('lead', 'leadId contactName company email')
      .populate('client', 'clientId company contacts')
      .populate('createdBy', 'name email')
      .populate('versions.snapshotBy', 'name email');
    if (!proposal) throw new AppError('Proposal not found', 404, 'NOT_FOUND');
    return proposal;
  }

  async create(data, userId) {
    const proposal = await Proposal.create({ ...data, createdBy: userId });
    return Proposal.findById(proposal._id)
      .populate('lead', 'leadId contactName company')
      .populate('client', 'clientId company')
      .populate('createdBy', 'name email');
  }

  async update(id, data, userId) {
    const proposal = await Proposal.findById(id);
    if (!proposal) throw new AppError('Proposal not found', 404, 'NOT_FOUND');

    // Snapshot current state to versions array if any meaningful field changed
    const meaningfulFields = ['title', 'summary', 'lineItems', 'discountType', 'discountValue', 'paymentTerms', 'validityDate', 'notes'];
    const hasChanges = meaningfulFields.some((f) => data[f] !== undefined);

    if (hasChanges) {
      proposal.versions.push({
        version: proposal.version,
        title: proposal.title,
        summary: proposal.summary,
        lineItems: proposal.lineItems.map((li) => ({ ...li.toObject() })),
        discountType: proposal.discountType,
        discountValue: proposal.discountValue,
        paymentTerms: proposal.paymentTerms.map((p) => ({ ...p.toObject() })),
        validityDate: proposal.validityDate,
        notes: proposal.notes,
        revisionNote: data.revisionNote || '',
        snapshotBy: userId,
      });
      proposal.version += 1;
    }

    // Apply updates
    Object.keys(data).forEach((key) => {
      if (key !== 'revisionNote') proposal[key] = data[key];
    });

    await proposal.save();
    return Proposal.findById(id)
      .populate('lead', 'leadId contactName company')
      .populate('client', 'clientId company')
      .populate('createdBy', 'name email');
  }

  async updateStatus(id, status, rejectionReason) {
    const proposal = await Proposal.findById(id);
    if (!proposal) throw new AppError('Proposal not found', 404, 'NOT_FOUND');

    proposal.status = status;
    const now = new Date();
    if (status === 'sent' && !proposal.sentAt) proposal.sentAt = now;
    if (status === 'viewed' && !proposal.viewedAt) proposal.viewedAt = now;
    if (status === 'accepted') proposal.acceptedAt = now;
    if (status === 'rejected') {
      proposal.rejectedAt = now;
      if (rejectionReason) proposal.rejectionReason = rejectionReason;
    }

    await proposal.save();
    return Proposal.findById(id)
      .populate('lead', 'leadId contactName company')
      .populate('client', 'clientId company');
  }

  async duplicate(id, userId) {
    const original = await Proposal.findById(id);
    if (!original) throw new AppError('Proposal not found', 404, 'NOT_FOUND');

    const data = original.toObject();
    delete data._id;
    delete data.proposalNumber;
    delete data.versions;
    delete data.sentAt;
    delete data.viewedAt;
    delete data.acceptedAt;
    delete data.rejectedAt;
    delete data.createdAt;
    delete data.updatedAt;
    data.title = `${data.title} (Copy)`;
    data.status = 'draft';
    data.version = 1;
    data.isTemplate = false;
    data.createdBy = userId;

    const duplicate = await Proposal.create(data);
    return Proposal.findById(duplicate._id)
      .populate('lead', 'leadId contactName company')
      .populate('client', 'clientId company');
  }

  async delete(id) {
    const proposal = await Proposal.findByIdAndDelete(id);
    if (!proposal) throw new AppError('Proposal not found', 404, 'NOT_FOUND');
    return proposal;
  }

  async getTemplates() {
    return Proposal.find({ isTemplate: true })
      .select('proposalNumber title templateName lineItems createdAt')
      .sort({ createdAt: -1 });
  }
}

export default new ProposalService();
