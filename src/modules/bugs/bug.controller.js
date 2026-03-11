import bugService from './bug.service.js';
import { sendSuccess } from '../../utils/index.js';

class BugController {
  async getAll(req, res, next) {
    try {
      const { bugs, meta } = await bugService.getAll(req.validQuery || req.query);
      sendSuccess(res, { data: bugs, meta });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const bug = await bugService.getById(req.params.id);
      sendSuccess(res, { data: bug });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const bug = await bugService.create(req.body, req.user.id);
      sendSuccess(res, { data: bug, message: 'Bug created successfully', statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const bug = await bugService.update(req.params.id, req.body);
      sendSuccess(res, { data: bug, message: 'Bug updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async transition(req, res, next) {
    try {
      const { bug, oldStatus, newStatus } = await bugService.transition(
        req.params.id, req.body.status
      );
      sendSuccess(res, {
        data: bug,
        message: `Bug status changed from "${oldStatus}" to "${newStatus}"`,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await bugService.delete(req.params.id);
      sendSuccess(res, { message: 'Bug deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getByProject(req, res, next) {
    try {
      const { bugs, meta } = await bugService.getByProject(req.params.projectId, req.validQuery || req.query);
      sendSuccess(res, { data: bugs, meta });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await bugService.getStats();
      sendSuccess(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getStatsByProject(req, res, next) {
    try {
      const stats = await bugService.getStats(req.params.projectId);
      sendSuccess(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getLinkedBugs(req, res, next) {
    try {
      const bugs = await bugService.getLinkedBugs(req.params.taskId);
      sendSuccess(res, { data: bugs });
    } catch (error) {
      next(error);
    }
  }
}

export default new BugController();
