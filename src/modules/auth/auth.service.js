import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env, logger } from '../../config/index.js';
import { AppError, generateToken } from '../../utils/index.js';
import User from '../users/user.model.js';

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.jwt.accessSecret,
      { expiresIn: env.jwt.accessExpiresIn }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      env.jwt.refreshSecret,
      { expiresIn: env.jwt.refreshExpiresIn }
    );
  }

  async register(data) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
    }

    const user = await User.create(data);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'inactive') {
      throw new AppError('Account is deactivated. Contact your administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async refreshToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwt.refreshSecret);
    } catch {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    const resetToken = generateToken(32);
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Return plain token for email sending (caller handles email)
    return resetToken;
  }

  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    user.mustResetPassword = false;
    await user.save();

    return user;
  }
  async forceResetPassword(userId, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    if (!user.mustResetPassword) {
      throw new AppError('Password reset is not required', 400, 'NOT_REQUIRED');
    }

    user.password = newPassword;
    user.mustResetPassword = false;
    await user.save();

    return user;
  }
}

export default new AuthService();
