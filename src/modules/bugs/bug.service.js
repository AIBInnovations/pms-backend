import mongoose from 'mongoose';
import Bug from './bug.model.js';
import Project from '../projects/project.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

class BugService {
  async getAll(query = {}) {
    const {
      page = 1, limit = 20, search, project, severity, priority, status,
      assignee, reporter, sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { bugId: { $regex: search, $options: 'i' } },
      ];
    }
    if (project) filter.project = project;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (reporter) filter.reporter = reporter;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [bugs, total] = await Promise.all([
      Bug.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('reporter', 'name email')
        .populate('project', 'code name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Bug.countDocuments(filter),
    ]);

    return { bugs, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const bug = await Bug.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email')
      .populate('project', 'code name')
      .populate('relatedTask', 'taskId title stage');

    if (!bug) {
      throw new AppError('Bug not found', 404, 'NOT_FOUND');
    }
    return bug;
  }

  async create(data, userId) {
    // Validate project exists
    const project = await Project.findById(data.project);
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    const bug = await Bug.create({ ...data, reporter: userId });
    return Bug.findById(bug._id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email')
      .populate('project', 'code name');
  }

  async update(id, data) {
    const bug = await Bug.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email')
      .populate('project', 'code name');

    if (!bug) {
      throw new AppError('Bug not found', 404, 'NOT_FOUND');
    }
    return bug;
  }

  async transition(id, newStatus) {
    const bug = await Bug.findById(id);
    if (!bug) {
      throw new AppError('Bug not found', 404, 'NOT_FOUND');
    }

    const oldStatus = bug.status;
    bug.status = newStatus;
    await bug.save();

    return { bug, oldStatus, newStatus };
  }

  async delete(id) {
    const bug = await Bug.findByIdAndDelete(id);
    if (!bug) {
      throw new AppError('Bug not found', 404, 'NOT_FOUND');
    }
    return bug;
  }

  async getByProject(projectId, query = {}) {
    return this.getAll({ ...query, project: projectId });
  }

  async getStats(projectId) {
    const match = projectId
      ? { project: new mongoose.Types.ObjectId(projectId) }
      : {};

    const [byStatusResult, bySeverityResult] = await Promise.all([
      Bug.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Bug.aggregate([
        { $match: match },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
    ]);

    const byStatus = {};
    for (const r of byStatusResult) {
      byStatus[r._id] = r.count;
    }

    const bySeverity = {};
    for (const r of bySeverityResult) {
      bySeverity[r._id] = r.count;
    }

    return { byStatus, bySeverity };
  }

  async getLinkedBugs(taskId) {
    return Bug.find({ relatedTask: taskId })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 });
  }
}

export default new BugService();
