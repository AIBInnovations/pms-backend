import projectService from './project.service.js';
import { sendSuccess } from '../../utils/index.js';

class ProjectController {
  // ─── Projects ────────────────────────────────────────

  async getAll(req, res, next) {
    try {
      const { projects, meta } = await projectService.getAll(req.validQuery || req.query, req.user.id, req.user.role);
      sendSuccess(res, { data: projects, meta });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id, req.user.id, req.user.role);
      sendSuccess(res, { data: project });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const project = await projectService.create(req.body, req.user.id);
      sendSuccess(res, { data: project, message: 'Project created successfully', statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const project = await projectService.update(req.params.id, req.body);
      sendSuccess(res, { data: project, message: 'Project updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await projectService.delete(req.params.id);
      sendSuccess(res, { message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getTeam(req, res, next) {
    try {
      const members = await projectService.getTeamMembers(req.params.id);
      sendSuccess(res, { data: members });
    } catch (error) {
      next(error);
    }
  }

  // ─── Revenues ───────────────────────────────────────

  async getRevenues(req, res, next) {
    try {
      const revenues = await projectService.getRevenues(req.params.id);
      sendSuccess(res, { data: revenues });
    } catch (error) { next(error); }
  }

  async addRevenue(req, res, next) {
    try {
      const revenue = await projectService.addRevenue(req.params.id, req.body);
      sendSuccess(res, { data: revenue, message: 'Revenue added' }, 201);
    } catch (error) { next(error); }
  }

  async updateRevenue(req, res, next) {
    try {
      const revenue = await projectService.updateRevenue(req.params.id, req.params.revenueId, req.body);
      sendSuccess(res, { data: revenue, message: 'Revenue updated' });
    } catch (error) { next(error); }
  }

  async removeRevenue(req, res, next) {
    try {
      await projectService.removeRevenue(req.params.id, req.params.revenueId);
      sendSuccess(res, { message: 'Revenue removed' });
    } catch (error) { next(error); }
  }

  // ─── Milestones ──────────────────────────────────────

  async getMilestones(req, res, next) {
    try {
      const milestones = await projectService.getMilestones(req.params.id);
      sendSuccess(res, { data: milestones });
    } catch (error) {
      next(error);
    }
  }

  async createMilestone(req, res, next) {
    try {
      const milestone = await projectService.createMilestone(req.params.id, req.body, req.user.id);
      sendSuccess(res, { data: milestone, message: 'Milestone created successfully', statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async updateMilestone(req, res, next) {
    try {
      const milestone = await projectService.updateMilestone(req.params.milestoneId, req.body);
      sendSuccess(res, { data: milestone, message: 'Milestone updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteMilestone(req, res, next) {
    try {
      await projectService.deleteMilestone(req.params.milestoneId);
      sendSuccess(res, { message: 'Milestone deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProjectController();
