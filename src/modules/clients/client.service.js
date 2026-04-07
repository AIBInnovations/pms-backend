import Client from './client.model.js';
import { AppError } from '../../utils/index.js';

class ClientService {
  async getAll(query = {}) {
    const { search, status, tag, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const conditions = [];

    if (search) {
      conditions.push({
        $or: [
          { company: { $regex: search, $options: 'i' } },
          { 'contacts.name': { $regex: search, $options: 'i' } },
          { 'contacts.email': { $regex: search, $options: 'i' } },
          { clientId: { $regex: search, $options: 'i' } },
        ],
      });
    }
    if (status) conditions.push({ status });
    if (tag) conditions.push({ tags: tag });

    const filter = conditions.length > 0 ? { $and: conditions } : {};
    return Client.find(filter)
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
  }

  async getById(id) {
    const client = await Client.findById(id)
      .populate('createdBy', 'name email')
      .populate('sourceLead', 'leadId contactName')
      .populate('internalNotes.createdBy', 'name email');

    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');

    // Look up linked projects, invoices, proposals (manual since no reverse refs)
    const Project = (await import('../projects/project.model.js')).default;
    const projects = await Project.find({
      $or: [
        { 'contacts.email': { $in: client.contacts.map((c) => c.email).filter(Boolean) } },
      ],
    }).select('name code status budget').limit(50);

    // Lifetime value: sum of paid invoices on those projects
    const projectIds = projects.map((p) => p._id);
    let lifetimeValue = 0;
    if (projectIds.length > 0) {
      const { Payment } = await import('../accounts/accounts.model.js');
      const result = await Payment.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      lifetimeValue = result[0]?.total || 0;
    }

    return {
      ...client.toJSON(),
      linkedProjects: projects,
      lifetimeValue,
    };
  }

  async create(data, userId) {
    // Ensure exactly one primary contact
    if (data.contacts?.length) {
      const hasPrimary = data.contacts.some((c) => c.isPrimary);
      if (!hasPrimary) data.contacts[0].isPrimary = true;
    }

    const client = await Client.create({ ...data, createdBy: userId });
    return Client.findById(client._id).populate('createdBy', 'name email');
  }

  async update(id, data) {
    if (data.status === 'churned' && !data.churnDate) {
      data.churnDate = new Date();
    }

    // Ensure exactly one primary contact when contacts updated
    if (data.contacts?.length) {
      const hasPrimary = data.contacts.some((c) => c.isPrimary);
      if (!hasPrimary) data.contacts[0].isPrimary = true;
    }

    const client = await Client.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('createdBy', 'name email');
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return client;
  }

  async delete(id) {
    const client = await Client.findByIdAndDelete(id);
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return client;
  }

  async addNote(clientId, text, userId) {
    const client = await Client.findById(clientId);
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    client.internalNotes.push({ text, createdBy: userId });
    await client.save();
    return Client.findById(clientId).populate('internalNotes.createdBy', 'name email');
  }

  async deleteNote(clientId, noteId) {
    const client = await Client.findById(clientId);
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    const note = client.internalNotes.id(noteId);
    if (!note) throw new AppError('Note not found', 404, 'NOT_FOUND');
    note.deleteOne();
    await client.save();
    return client;
  }
}

export default new ClientService();
