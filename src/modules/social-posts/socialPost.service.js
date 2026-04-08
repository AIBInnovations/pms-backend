import mongoose from 'mongoose';
import SocialPost from './socialPost.model.js';
import { AppError, buildPaginationMeta, notify, notifyMany } from '../../utils/index.js';

class SocialPostService {
  async getAll(query = {}) {
    const {
      page = 1, limit = 20, search, status, platform, assignee, campaign,
      startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const filter = {};
    if (status) filter.status = status;
    if (platform) filter.platforms = platform;
    if (assignee) filter.assignee = assignee;
    if (campaign) filter.campaign = campaign;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { campaign: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.scheduledAt = {};
      if (startDate) filter.scheduledAt.$gte = new Date(startDate);
      if (endDate) filter.scheduledAt.$lte = new Date(endDate);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      SocialPost.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('approvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      SocialPost.countDocuments(filter),
    ]);

    return { records, meta: buildPaginationMeta(total, Number(page), Number(limit)) };
  }

  async getById(id) {
    const post = await SocialPost.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email');
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    return post;
  }

  async getCalendar(year, month) {
    const y = Number(year);
    const m = Number(month);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    return SocialPost.find({
      scheduledAt: { $gte: start, $lt: end },
      status: { $ne: 'archived' },
    })
      .populate('assignee', 'name avatar')
      .select('postId title content platforms status scheduledAt assignee campaign media')
      .sort({ scheduledAt: 1 });
  }

  async getStats() {
    const counts = await SocialPost.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    return {
      idea: map.idea || 0,
      draft: map.draft || 0,
      pending_approval: map.pending_approval || 0,
      scheduled: map.scheduled || 0,
      published: map.published || 0,
      rejected: map.rejected || 0,
      archived: map.archived || 0,
      total: counts.reduce((s, c) => s + c.count, 0),
    };
  }

  async create(data, userId) {
    const post = await SocialPost.create({ ...data, createdBy: userId });
    return this.getById(post._id);
  }

  async update(id, data) {
    const post = await SocialPost.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email');
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    return post;
  }

  async delete(id) {
    const post = await SocialPost.findByIdAndDelete(id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    return post;
  }

  async submitForApproval(id, userId) {
    const post = await SocialPost.findById(id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    if (!['draft', 'idea', 'rejected'].includes(post.status)) {
      throw new AppError(`Cannot submit a post in status "${post.status}"`, 400, 'BAD_STATE');
    }
    post.status = 'pending_approval';
    post.rejectionReason = '';
    await post.save();

    // Notify all admins
    const User = mongoose.model('User');
    const admins = await User.find({ role: 'super_admin' }).select('_id');
    await notifyMany(admins.map((a) => a._id), {
      type: 'social_post_approval',
      title: 'Social Post Awaiting Approval',
      message: `${post.postId} — ${post.title}`,
      entityType: 'SocialPost',
      entityId: post._id,
      link: '/social-posts',
      actor: userId,
    });

    return this.getById(post._id);
  }

  async approve(id, adminId) {
    const post = await SocialPost.findById(id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    if (post.status !== 'pending_approval') {
      throw new AppError('Only posts pending approval can be approved', 400, 'BAD_STATE');
    }
    post.status = 'scheduled';
    post.approvedBy = adminId;
    post.approvedAt = new Date();
    await post.save();

    if (post.assignee || post.createdBy) {
      await notify({
        userId: post.assignee || post.createdBy,
        type: 'social_post_approved',
        title: 'Social Post Approved',
        message: `${post.postId} — ${post.title}`,
        entityType: 'SocialPost',
        entityId: post._id,
        link: '/social-posts',
        actor: adminId,
      });
    }
    return this.getById(post._id);
  }

  async reject(id, adminId, reason) {
    const post = await SocialPost.findById(id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    if (post.status !== 'pending_approval') {
      throw new AppError('Only posts pending approval can be rejected', 400, 'BAD_STATE');
    }
    post.status = 'rejected';
    post.rejectionReason = reason || '';
    post.approvedBy = adminId;
    post.approvedAt = new Date();
    await post.save();

    if (post.assignee || post.createdBy) {
      await notify({
        userId: post.assignee || post.createdBy,
        type: 'social_post_rejected',
        title: 'Social Post Rejected',
        message: `${post.postId} — ${reason || 'No reason provided'}`,
        entityType: 'SocialPost',
        entityId: post._id,
        link: '/social-posts',
        actor: adminId,
      });
    }
    return this.getById(post._id);
  }

  async markPublished(id) {
    const post = await SocialPost.findById(id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    if (post.status !== 'scheduled') {
      throw new AppError('Only scheduled posts can be marked as published', 400, 'BAD_STATE');
    }
    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();
    return this.getById(post._id);
  }

  async archive(id) {
    const post = await SocialPost.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    return this.getById(post._id);
  }
}

export default new SocialPostService();
