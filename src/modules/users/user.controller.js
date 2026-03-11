import userService from './user.service.js';
import { sendSuccess } from '../../utils/index.js';

class UserController {
  async getAll(req, res, next) {
    try {
      const { users, meta } = await userService.getAll(req.validQuery || req.query);
      sendSuccess(res, { data: users, meta });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      sendSuccess(res, { data: user });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body);
      sendSuccess(res, {
        data: user,
        message: 'User created successfully',
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(req.params.id, req.body);
      sendSuccess(res, { data: user, message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const user = await userService.updateRole(req.params.id, req.body.role);
      sendSuccess(res, { data: user, message: 'Role updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const user = await userService.updateStatus(req.params.id, req.body.status);
      sendSuccess(res, { data: user, message: 'Status updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user.id, currentPassword, newPassword);
      sendSuccess(res, { message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await userService.getById(req.user.id);
      sendSuccess(res, { data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.update(req.user.id, req.body);
      sendSuccess(res, { data: user, message: 'Profile updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.delete(req.params.id);
      sendSuccess(res, { message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
