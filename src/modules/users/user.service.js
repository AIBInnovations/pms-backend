import User from './user.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

class UserService {
  async getAll(query = {}) {
    const { page = 1, limit = 20, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  }

  async create(data) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
    }
    return User.create({ ...data, mustResetPassword: true });
  }

  async update(id, data) {
    const user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  }

  async updateRole(id, role) {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  }

  async updateStatus(id, status) {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  }

  async changePassword(id, currentPassword, newPassword) {
    const user = await User.findById(id).select('+password');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    user.password = newPassword;
    await user.save();
    return user;
  }

  async delete(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  }
}

export default new UserService();
