import taskService from './task.service.js';
import { sendSuccess } from '../../utils/index.js';

class TaskController {
  async getAll(req, res, next) {
    try {
      const { tasks, meta } = await taskService.getAll(req.validQuery || req.query, req.user.id, req.user.role);
      sendSuccess(res, { data: tasks, meta });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const task = await taskService.getById(req.params.id);
      sendSuccess(res, { data: task });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const task = await taskService.create(req.body, req.user.id, req.user.role);
      sendSuccess(res, { data: task, message: 'Task created successfully', statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const task = await taskService.update(req.params.id, req.body, req.user.role);
      sendSuccess(res, { data: task, message: 'Task updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async transition(req, res, next) {
    try {
      const { task, oldStage, newStage } = await taskService.transition(
        req.params.id, req.body.stage, req.user.id, req.user.role
      );
      sendSuccess(res, {
        data: task,
        message: `Task moved from "${oldStage}" to "${newStage}"`,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await taskService.delete(req.params.id);
      sendSuccess(res, { message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getSubtasks(req, res, next) {
    try {
      const subtasks = await taskService.getSubtasks(req.params.id);
      sendSuccess(res, { data: subtasks });
    } catch (error) {
      next(error);
    }
  }

  async bulkAction(req, res, next) {
    try {
      const { taskIds, action, value } = req.body;
      const result = await taskService.bulkAction(taskIds, action, value);
      sendSuccess(res, { data: result, message: `Bulk ${action} completed` });
    } catch (error) {
      next(error);
    }
  }

  async getByProject(req, res, next) {
    try {
      const { tasks, meta } = await taskService.getByProject(req.params.projectId, req.validQuery || req.query);
      sendSuccess(res, { data: tasks, meta });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await taskService.getStats(req.params.projectId);
      sendSuccess(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getWorkload(req, res, next) {
    try {
      const data = await taskService.getWorkload(req.params.projectId);
      sendSuccess(res, { data });
    } catch (error) {
      next(error);
    }
  }

  async addAttachment(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      }
      const attachment = await taskService.addAttachment(req.params.id, req.file, req.user.id);
      sendSuccess(res, { data: attachment, message: 'Attachment uploaded', statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async removeAttachment(req, res, next) {
    try {
      await taskService.removeAttachment(req.params.id, req.params.attachmentId);
      sendSuccess(res, { message: 'Attachment removed' });
    } catch (error) {
      next(error);
    }
  }

  async saveAnnotatedImage(req, res, next) {
    try {
      const { image, attachmentId } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: { message: 'No image data' } });
      }
      const attachment = await taskService.saveAnnotatedImage(req.params.id, image, attachmentId, req.user.id);
      sendSuccess(res, { data: attachment, message: 'Annotated image saved' }, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
