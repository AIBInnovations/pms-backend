import commentService from './comment.service.js';
import { sendSuccess } from '../../utils/index.js';

class CommentController {
  async getByCommentable(req, res, next) {
    try {
      const query = req.validQuery || req.query;
      const { commentableType, commentableId } = query;
      const { comments, meta } = await commentService.getByCommentable(
        commentableType,
        commentableId,
        query
      );
      sendSuccess(res, { data: comments, meta });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const comment = await commentService.create(req.body, req.user.id);
      sendSuccess(res, { data: comment, message: 'Comment created successfully', statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const comment = await commentService.update(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, { data: comment, message: 'Comment updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await commentService.delete(req.params.id, req.user.id, req.user.role);
      sendSuccess(res, { message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addReaction(req, res, next) {
    try {
      const comment = await commentService.addReaction(
        req.params.id,
        req.body.emoji,
        req.user.id
      );
      sendSuccess(res, { data: comment, message: 'Reaction toggled successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getReplies(req, res, next) {
    try {
      const query = req.validQuery || req.query;
      const { replies, meta } = await commentService.getReplies(req.params.id, query);
      sendSuccess(res, { data: replies, meta });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();
