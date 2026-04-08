import Project from './project.model.js';
import { RecurringPlan } from '../accounts/accounts.model.js';
import Task from '../tasks/task.model.js';
import Milestone from './milestone.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

class ProjectService {
  // ─── Projects ────────────────────────────────────────

  async getAll(query = {}, userId, userRole) {
    const { page = 1, limit = 20, search, type, status, domain, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const conditions = [];

    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      });
    }
    if (type) conditions.push({ type });
    if (status) conditions.push({ status });
    if (domain) conditions.push({ domains: domain });

    // Scoped access: non-admins only see their projects
    if (userRole === 'developer') {
      conditions.push({ $or: [{ developers: userId }, { projectManagers: userId }] });
    } else if (userRole === 'project_manager') {
      conditions.push({ $or: [{ projectManagers: userId }, { developers: userId }, { createdBy: userId }] });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('projectManagers', 'name email avatar')
        .populate('developers', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    return { projects, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id, userId, userRole) {
    const project = await Project.findById(id)
      .populate('projectManagers', 'name email avatar designation')
      .populate('developers', 'name email avatar designation')
      .populate('createdBy', 'name email')
      .populate('linkedLead', 'leadId contactName company');

    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    // Access check for non-admins
    if (userRole !== 'super_admin') {
      const isMember =
        project.projectManagers?.some((pm) => pm._id.toString() === userId) ||
        project.developers.some((d) => d._id.toString() === userId) ||
        project.createdBy?._id.toString() === userId;
      if (!isMember) {
        throw new AppError('Access denied to this project', 403, 'FORBIDDEN');
      }
    }

    return project;
  }

  async create(data, userId) {
    // Normalize type to array
    if (typeof data.type === 'string') data.type = [data.type];

    const project = await Project.create({ ...data, createdBy: userId });

    // Auto-create recurring plan if retainer is selected
    const types = Array.isArray(data.type) ? data.type : [data.type];
    if (types.includes('retainer') && (data.recurringAmount > 0 || data.budget > 0)) {
      const hasFixedCost = types.includes('fixed_cost');
      await RecurringPlan.create({
        project: project._id,
        setupFee: hasFixedCost ? (data.budget || 0) : 0,
        recurringAmount: data.recurringAmount || 0,
        frequency: 'monthly',
        startDate: data.startDate || new Date(),
        createdBy: userId,
      });
    }

    return Project.findById(project._id)
      .populate('projectManagers', 'name email avatar')
      .populate('developers', 'name email avatar');
  }

  async update(id, data) {
    // Get old project to detect removed team members
    const oldProject = await Project.findById(id).select('projectManagers developers');
    if (!oldProject) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    const project = await Project.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('projectManagers', 'name email avatar')
      .populate('developers', 'name email avatar');

    // Unassign removed members from all tasks in this project
    if (data.developers !== undefined || data.projectManagers !== undefined) {
      const oldTeam = new Set([
        ...(oldProject.projectManagers || []).map((pm) => pm.toString()),
        ...oldProject.developers.map((d) => d.toString()),
      ].filter(Boolean));

      const newTeam = new Set([
        ...(data.projectManagers || project.projectManagers?.map((pm) => pm._id) || []).map((id) => id.toString()),
        ...(data.developers || project.developers.map((d) => d._id)).map((d) => d.toString()),
      ].filter(Boolean));

      const removedMembers = [...oldTeam].filter((id) => !newTeam.has(id));

      if (removedMembers.length > 0) {
        await Task.updateMany(
          { project: id, assignees: { $in: removedMembers } },
          { $pull: { assignees: { $in: removedMembers } } }
        );
      }
    }

    return project;
  }

  async delete(id) {
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    return project;
  }

  async getTeamMembers(projectId) {
    const project = await Project.findById(projectId)
      .populate('projectManagers', 'name email avatar designation role')
      .populate('developers', 'name email avatar designation role');

    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    const members = [];
    for (const pm of (project.projectManagers || [])) {
      members.push({ ...pm.toObject(), projectRole: 'project_manager' });
    }
    for (const dev of project.developers) {
      members.push({ ...dev.toObject(), projectRole: 'developer' });
    }
    return members;
  }

  // ─── Revenues ───────────────────────────────────────

  async getRevenues(projectId) {
    const project = await Project.findById(projectId).select('revenues');
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
    return project.revenues || [];
  }

  async addRevenue(projectId, data) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
    project.revenues.push(data);
    await project.save();
    return project.revenues[project.revenues.length - 1];
  }

  async updateRevenue(projectId, revenueId, data) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
    const rev = project.revenues.id(revenueId);
    if (!rev) throw new AppError('Revenue entry not found', 404, 'NOT_FOUND');
    Object.assign(rev, data);
    await project.save();
    return rev;
  }

  async removeRevenue(projectId, revenueId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
    const rev = project.revenues.id(revenueId);
    if (!rev) throw new AppError('Revenue entry not found', 404, 'NOT_FOUND');
    rev.deleteOne();
    await project.save();
    return { message: 'Revenue entry removed' };
  }

  // ─── Milestones ──────────────────────────────────────

  async getMilestones(projectId) {
    return Milestone.find({ project: projectId })
      .sort({ dueDate: 1, createdAt: 1 })
      .populate('createdBy', 'name');
  }

  async createMilestone(projectId, data, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    return Milestone.create({ ...data, project: projectId, createdBy: userId });
  }

  async updateMilestone(milestoneId, data) {
    const milestone = await Milestone.findByIdAndUpdate(milestoneId, data, { new: true, runValidators: true });
    if (!milestone) {
      throw new AppError('Milestone not found', 404, 'NOT_FOUND');
    }
    return milestone;
  }

  async deleteMilestone(milestoneId) {
    const milestone = await Milestone.findByIdAndDelete(milestoneId);
    if (!milestone) {
      throw new AppError('Milestone not found', 404, 'NOT_FOUND');
    }
    return milestone;
  }
}

export default new ProjectService();
