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
}

export default new LeadService();
