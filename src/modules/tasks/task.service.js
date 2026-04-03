import mongoose from 'mongoose';
import Task from './task.model.js';
import Project from '../projects/project.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';
import { cloudinary } from '../../middleware/upload.js';

const STAGE_ORDER = ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'archived'];

class TaskService {
  async getAll(query = {}, userId, userRole) {
    const {
      page = 1, limit = 50, search, project, type, priority, stage,
      assignee, parentTask, sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { taskId: { $regex: search, $options: 'i' } },
      ];
    }
    if (project) filter.project = project;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (stage) filter.stage = stage;
    if (assignee) filter.assignees = assignee;
    if (parentTask === 'null') {
      filter.parentTask = null;
    } else if (parentTask) {
      filter.parentTask = parentTask;
    }

    // Scoped access: non-admins only see tasks from their projects
    if (userId && userRole && userRole !== 'super_admin') {
      const projectFilter = userRole === 'developer'
        ? { $or: [{ developers: userId }, { projectManagers: userId }] }
        : { $or: [{ projectManagers: userId }, { developers: userId }, { createdBy: userId }] };
      const accessibleProjectIds = await Project.find(projectFilter).distinct('_id');
      filter.project = filter.project
        ? { $in: accessibleProjectIds.filter((pid) => pid.toString() === filter.project) }
        : { $in: accessibleProjectIds };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignees', 'name email avatar')
        .populate('project', 'code name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    return { tasks, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const task = await Task.findById(id)
      .populate('assignees', 'name email avatar designation')
      .populate('watchers', 'name email avatar')
      .populate('project', 'code name projectManagers developers')
      .populate('parentTask', 'taskId title stage')
      .populate('dependencies', 'taskId title stage')
      .populate('milestone', 'title status dueDate')
      .populate('createdBy', 'name email');

    if (!task) {
      throw new AppError('Task not found', 404, 'NOT_FOUND');
    }
    return task;
  }

  async create(data, userId, userRole) {
    // Developers are always auto-assigned to their own tasks
    if (userRole === 'developer') {
      data.assignees = [userId];
    }

    // Validate project exists
    const project = await Project.findById(data.project);
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    // Validate assignees are part of the project team
    if (data.assignees?.length) {
      const teamIds = [
        ...(project.projectManagers || []).map((pm) => pm.toString()),
        ...project.developers.map((d) => d.toString()),
      ];
      const invalidAssignees = data.assignees.filter((a) => !teamIds.includes(a));
      if (invalidAssignees.length) {
        throw new AppError('Some assignees are not members of this project', 400, 'INVALID_ASSIGNEES');
      }
    }

    const task = await Task.create({ ...data, createdBy: userId });
    return Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('project', 'code name');
  }

  async update(id, data, userRole) {
    // Developers cannot change assignees
    if (userRole === 'developer') {
      delete data.assignees;
    }

    // If updating assignees, validate against project team
    if (data.assignees) {
      const task = await Task.findById(id);
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

      const project = await Project.findById(task.project);
      const teamIds = [
        ...(project.projectManagers || []).map((pm) => pm.toString()),
        ...project.developers.map((d) => d.toString()),
      ];
      const invalidAssignees = data.assignees.filter((a) => !teamIds.includes(a));
      if (invalidAssignees.length) {
        throw new AppError('Some assignees are not members of this project', 400, 'INVALID_ASSIGNEES');
      }
    }

    const task = await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('assignees', 'name email avatar')
      .populate('project', 'code name');

    if (!task) {
      throw new AppError('Task not found', 404, 'NOT_FOUND');
    }

    // Recalculate progress if checklists changed
    if (data.checklists) {
      await this.recalculateProgress(id);
    }

    return task;
  }

  async transition(id, newStage, userId, userRole) {
    const task = await Task.findById(id).populate('project', 'stageRestrictions projectManager');
    if (!task) {
      throw new AppError('Task not found', 404, 'NOT_FOUND');
    }

    // Check stage restrictions from project config
    const restrictions = task.project?.stageRestrictions;
    if (restrictions && restrictions.size > 0) {
      const allowedStages = restrictions.get(userRole);
      if (allowedStages && !allowedStages.includes(newStage)) {
        throw new AppError(`Your role cannot move tasks to "${newStage}"`, 403, 'STAGE_RESTRICTED');
      }
    }

    // Block transition if task has unresolved blockers
    if (task.isBlocked && newStage !== 'backlog') {
      throw new AppError('Cannot advance a blocked task. Resolve the blocker first.', 400, 'TASK_BLOCKED');
    }

    // Overdue tasks can only move to in_review, testing, done, or backlog
    if (task.dueDate && new Date(task.dueDate) < new Date() && ['todo', 'in_progress'].includes(newStage)) {
      throw new AppError(
        'This task is overdue. It can only be moved to In Review, Testing, or Done.',
        400,
        'OVERDUE_RESTRICTED',
      );
    }

    const oldStage = task.stage;
    task.stage = newStage;

    // Auto-escalate priority when sent to backlog
    if (newStage === 'backlog' && task.priority !== 'critical') {
      task.priority = 'high';
    }

    // Silently log the transition
    task.stageHistory.push({
      from: oldStage,
      to: newStage,
      changedBy: userId,
      changedAt: new Date(),
    });

    // Auto-set progress for done
    if (newStage === 'done') {
      task.progress = 100;
    }

    await task.save();

    // If this task has a parent, recalculate parent progress
    if (task.parentTask) {
      await this.recalculateProgress(task.parentTask);
    }

    return { task, oldStage, newStage };
  }

  async delete(id) {
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      throw new AppError('Task not found', 404, 'NOT_FOUND');
    }
    // Also delete subtasks
    await Task.deleteMany({ parentTask: id });
    return task;
  }

  async getSubtasks(parentId) {
    return Task.find({ parentTask: parentId })
      .populate('assignees', 'name email avatar')
      .sort({ createdAt: 1 });
  }

  async bulkAction(taskIds, action, value) {
    const updateMap = {
      reassign: { assignees: value },
      change_priority: { priority: value },
      change_stage: { stage: value },
      archive: { stage: 'archived' },
    };

    const update = updateMap[action];
    if (!update) {
      throw new AppError('Invalid bulk action', 400, 'INVALID_ACTION');
    }

    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: update }
    );

    return { modifiedCount: result.modifiedCount };
  }

  async getByProject(projectId, query = {}) {
    return this.getAll({ ...query, project: projectId });
  }

  async getStats(projectId) {
    const match = projectId
      ? { project: new mongoose.Types.ObjectId(projectId) }
      : {};

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
        },
      },
    ];

    const results = await Task.aggregate(pipeline);
    const stats = {};
    for (const r of results) {
      stats[r._id] = r.count;
    }
    return stats;
  }

  async recalculateProgress(taskId) {
    const task = await Task.findById(taskId);
    if (!task) return;

    const subtasks = await Task.find({ parentTask: taskId });
    let progress = 0;

    if (subtasks.length > 0) {
      const done = subtasks.filter((s) => s.stage === 'done').length;
      progress = Math.round((done / subtasks.length) * 100);
    } else if (task.checklists?.length > 0) {
      const checked = task.checklists.filter((c) => c.checked).length;
      progress = Math.round((checked / task.checklists.length) * 100);
    }

    await Task.findByIdAndUpdate(taskId, { progress });
  }

  async addAttachment(taskId, file, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    // Cloudinary stores URL in file.path, local multer uses /uploads/filename
    const url = file.path || `/uploads/${file.filename}`;

    task.attachments.push({
      name: file.originalname,
      url,
      uploadedBy: userId,
    });
    await task.save();
    return task.attachments[task.attachments.length - 1];
  }

  async saveAnnotatedImage(taskId, base64Image, name, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'pms-annotations',
      resource_type: 'image',
    });

    task.attachments.push({
      name,
      url: result.secure_url,
      uploadedBy: userId,
    });
    await task.save();
    return task.attachments[task.attachments.length - 1];
  }

  async removeAttachment(taskId, attachmentId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) throw new AppError('Attachment not found', 404, 'NOT_FOUND');

    // Delete from Cloudinary if it's a Cloudinary URL
    if (attachment.url?.includes('cloudinary.com')) {
      try {
        // Extract public_id from URL: .../pms-attachments/abc123.ext → pms-attachments/abc123
        const parts = attachment.url.split('/');
        const folder = parts[parts.length - 2];
        const fileWithExt = parts[parts.length - 1];
        const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Don't block deletion if Cloudinary cleanup fails
      }
    }

    attachment.deleteOne();
    await task.save();
    return { message: 'Attachment removed' };
  }

  async getWorkload(projectId) {
    const match = { stage: { $nin: ['done', 'archived'] } };
    if (projectId) {
      match.project = new mongoose.Types.ObjectId(projectId);
    }

    return Task.aggregate([
      { $match: match },
      { $unwind: '$assignees' },
      {
        $group: {
          _id: '$assignees',
          totalTasks: { $sum: 1 },
          totalEstimatedHours: { $sum: { $ifNull: ['$estimatedHours', 0] } },
          priorities: { $push: '$priority' },
          stages: { $push: '$stage' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
        },
      },
      { $unwind: '$user' },
      { $sort: { totalTasks: -1 } },
    ]);
  }
}

export default new TaskService();
