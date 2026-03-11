import authService from './auth.service.js';
import { sendSuccess, sendError, sendResetEmail } from '../../utils/index.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);
      sendSuccess(res, {
        data: { user, accessToken, refreshToken },
        message: 'User registered successfully',
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      sendSuccess(res, {
        data: { user, accessToken, refreshToken },
        message: 'Logged in successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, {
        data: tokens,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const resetToken = await authService.forgotPassword(req.body.email);
      if (resetToken) {
        sendResetEmail(req.body.email, resetToken);
      }
      // Always respond the same way to prevent email enumeration
      sendSuccess(res, {
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      sendSuccess(res, { message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async forceResetPassword(req, res, next) {
    try {
      await authService.forceResetPassword(req.user.id, req.body.password);
      sendSuccess(res, { message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const { default: User } = await import('../users/user.model.js');
      const user = await User.findById(req.user.id);
      if (!user) {
        return sendError(res, {
          message: 'User not found',
          statusCode: 404,
          code: 'NOT_FOUND',
        });
      }
      sendSuccess(res, { data: user });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
