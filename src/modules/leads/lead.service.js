import Lead from './lead.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

class LeadService {
  async getAll(query = {}, userId, userRole) {
    const {
      page = 1, limit = 50, search, status, pipeline, assignee, source, budgetRange, priority,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const conditions = [];

    if (search) {
      conditions.push({
        $or: [
          { company: { $regex: search, $options: 'i' } },
          { contactName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { leadId: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (status) conditions.push({ status });
    if (pipeline) conditions.push({ pipeline });
    if (assignee) conditions.push({ assignee });
    if (source) conditions.push({ source });
    if (budgetRange) conditions.push({ budgetRange });
    if (priority !== undefined) conditions.push({ priority });

    // Sales Executives only see leads assigned to them OR created by them
    if (userRole === 'sales_executive') {
      conditions.push({ $or: [{ assignee: userId }, { createdBy: userId }] });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(filter),
    ]);

    return { records, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const lead = await Lead.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('convertedProject', 'name code status')
      .populate('internalNotes.createdBy', 'name email');

    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    return lead;
  }

  async checkDuplicate(email, company) {
    if (!email && !company) return null;
    const conditions = [];
    if (email) conditions.push({ email });
    if (company) conditions.push({ company: { $regex: `^${company}$`, $options: 'i' } });
    return Lead.findOne({ $or: conditions });
  }

  async create(data, userId) {
    const lead = await Lead.create({ ...data, createdBy: userId });
    return Lead.findById(lead._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email');
  }

  async update(id, data) {
    // If status is being changed to 'lost', require lostReason
    if (data.status === 'lost' && !data.lostReason) {
      throw new AppError('Lost reason is required when marking lead as Lost', 400, 'LOST_REASON_REQUIRED');
    }

    const lead = await Lead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

    Object.assign(lead, data);
    await lead.save();

    return Lead.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email');
  }

  async delete(id) {
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    return lead;
  }

  // Internal notes
  async addNote(leadId, text, userId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    lead.internalNotes.push({ text, createdBy: userId });
    await lead.save();
    return Lead.findById(leadId).populate('internalNotes.createdBy', 'name email');
  }

  async deleteNote(leadId, noteId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    const note = lead.internalNotes.id(noteId);
    if (!note) throw new AppError('Note not found', 404, 'NOT_FOUND');
    note.deleteOne();
    await lead.save();
    return lead;
  }

  // Convert a won lead into a project
  async convertToProject(leadId, overrides, userId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    if (lead.convertedProject) throw new AppError('Lead already converted', 400, 'ALREADY_CONVERTED');

    const Project = (await import('../projects/project.model.js')).default;

    // Map service interest to PMS domains
    const domainMap = {
      web_app: 'coded_web_app',
      mobile_app: 'coded_app',
      shopify: 'shopify',
      ai: 'ai_development',
      automation: 'automation',
    };
    const domains = (lead.serviceInterest || []).map((s) => domainMap[s]).filter(Boolean);

    const projectData = {
      name: overrides?.name || lead.company || lead.contactName,
      description: lead.description || '',
      type: ['fixed_cost'],
      status: 'planning',
      budget: lead.dealValue || 0,
      domains,
      linkedLead: lead._id,
      projectManagers: overrides?.projectManagers || [userId],
      createdBy: userId,
      ...overrides,
    };

    const project = await Project.create(projectData);

    // Auto-create client if doesn't exist
    let clientId = null;
    if (lead.email || lead.company) {
      const Client = (await import('../clients/client.model.js')).default;
      const existing = await Client.findOne({
        $or: [
          ...(lead.company ? [{ company: { $regex: `^${lead.company}$`, $options: 'i' } }] : []),
          ...(lead.email ? [{ 'contacts.email': lead.email }] : []),
        ],
      });
      if (existing) {
        clientId = existing._id;
      } else if (lead.company) {
        const newClient = await Client.create({
          company: lead.company,
          contacts: [{
            name: lead.contactName,
            email: lead.email || '',
            phone: lead.phone || '',
            isPrimary: true,
          }],
          source: lead.source,
          status: 'active',
          sourceLead: lead._id,
          createdBy: userId,
        });
        clientId = newClient._id;
      }
    }

    // Update lead
    lead.convertedProject = project._id;
    lead.status = 'won';
    await lead.save();

    return { project, clientId };
  }
}

export default new LeadService();
