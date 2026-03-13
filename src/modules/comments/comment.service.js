import Comment from './comment.model.js';
import User from '../users/user.model.js';
import Task from '../tasks/task.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

function extractMentionNames(body) {
  const matches = body.match(/@([a-zA-Z\s]+?)(?=\s@|\s|$|[.,!?;:])/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1).trim()).filter(Boolean);
}


class CommentService {
  async getByCommentable(type, id, query = {}) {
    const { page = 1, limit = 20, sortOrder = 'desc' } = query;

    const filter = { commentableType: type, commentableId: id, parentComment: null };
    const sort = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate('author', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Comment.countDocuments(filter),
    ]);

    return { comments, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const comment = await Comment.findById(id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');

    if (!comment) {
      throw new AppError('Comment not found', 404, 'NOT_FOUND');
    }
    return comment;
  }

  async create(data, userId) {
    // Parse @mentions from body
    if (data.body) {
      const names = extractMentionNames(data.body);
      if (names.length > 0) {
        const mentionedUsers = await User.find({
          name: { $in: names.map((n) => new RegExp(`^${n}$`, 'i')) },
        }).select('_id');
        data.mentions = mentionedUsers.map((u) => u._id);
      }
    }

    const comment = await Comment.create({ ...data, author: userId });

    // Stamp lastCommentAt on the parent task so cards can show new-comment badges
    if (data.commentableType === 'Task' && data.commentableId) {
      Task.updateOne({ _id: data.commentableId }, { lastCommentAt: comment.createdAt }).catch(() => {});
    }

    return Comment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');
  }

  async update(id, data, userId, userRole) {
    const comment = await Comment.findById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404, 'NOT_FOUND');
    }

    if (comment.author.toString() !== userId && userRole !== 'super_admin') {
      throw new AppError('You can only edit your own comments', 403, 'FORBIDDEN');
    }

    comment.body = data.body;
    if (data.mentions !== undefined) {
      comment.mentions = data.mentions;
    }
    await comment.save();

    return Comment.findById(id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');
  }

  async delete(id, userId, userRole) {
    const comment = await Comment.findById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404, 'NOT_FOUND');
    }

    if (comment.author.toString() !== userId && userRole !== 'super_admin') {
      throw new AppError('You can only delete your own comments', 403, 'FORBIDDEN');
    }

    // Delete child replies
    await Comment.deleteMany({ parentComment: id });
    await Comment.findByIdAndDelete(id);

    return comment;
  }

  async addReaction(commentId, emoji, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404, 'NOT_FOUND');
    }

    const existingReaction = comment.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(
        (u) => u.toString() === userId
      );
      if (userIndex > -1) {
        // Remove user from this reaction
        existingReaction.users.splice(userIndex, 1);
        // Remove reaction entirely if no users left
        if (existingReaction.users.length === 0) {
          comment.reactions = comment.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(userId);
      }
    } else {
      comment.reactions.push({ emoji, users: [userId] });
    }

    await comment.save();

    return Comment.findById(commentId)
      .populate('author', 'name email avatar');
  }

  async getReplies(commentId, query = {}) {
    const { page = 1, limit = 20, sortOrder = 'desc' } = query;

    const filter = { parentComment: commentId };
    const sort = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      Comment.find(filter)
        .populate('author', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Comment.countDocuments(filter),
    ]);

    return { replies, meta: buildPaginationMeta(total, page, limit) };
  }
}

export default new CommentService();
