import service from './socialPost.service.js';
import { sendSuccess, AppError } from '../../utils/index.js';

class SocialPostController {
  async getAll(req, res, next) {
    try {
      const { records, meta } = await service.getAll(req.query);
      sendSuccess(res, { data: records, meta });
    } catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try { sendSuccess(res, { data: await service.getById(req.params.id) }); } catch (e) { next(e); }
  }

  async getCalendar(req, res, next) {
    try {
      const now = new Date();
      const year = req.query.year || now.getFullYear();
      const month = req.query.month || now.getMonth() + 1;
      sendSuccess(res, { data: await service.getCalendar(year, month) });
    } catch (e) { next(e); }
  }

  async getStats(req, res, next) {
    try { sendSuccess(res, { data: await service.getStats() }); } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      sendSuccess(res, { data: await service.create(req.body, userId) }, 201);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { sendSuccess(res, { data: await service.update(req.params.id, req.body) }); } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try {
      await service.delete(req.params.id);
      sendSuccess(res, { data: { message: 'Post deleted' } });
    } catch (e) { next(e); }
  }

  async submit(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      sendSuccess(res, { data: await service.submitForApproval(req.params.id, userId) });
    } catch (e) { next(e); }
  }

  async approve(req, res, next) {
    try {
      const adminId = req.user.id || req.user._id;
      sendSuccess(res, { data: await service.approve(req.params.id, adminId) });
    } catch (e) { next(e); }
  }

  async reject(req, res, next) {
    try {
      const adminId = req.user.id || req.user._id;
      sendSuccess(res, { data: await service.reject(req.params.id, adminId, req.body.reason) });
    } catch (e) { next(e); }
  }

  async publish(req, res, next) {
    try { sendSuccess(res, { data: await service.markPublished(req.params.id) }); } catch (e) { next(e); }
  }

  async archive(req, res, next) {
    try { sendSuccess(res, { data: await service.archive(req.params.id) }); } catch (e) { next(e); }
  }

  async uploadMedia(req, res, next) {
    try {
      if (!req.file || !req.file.cloudUrl) {
        throw new AppError('No file uploaded', 400, 'BAD_REQUEST');
      }
      const isImage = req.file.mimetype.startsWith('image/');
      const isVideo = req.file.mimetype.startsWith('video/');
      sendSuccess(res, {
        data: {
          url: req.file.cloudUrl,
          type: isImage ? 'image' : isVideo ? 'video' : 'other',
          name: req.file.originalname,
          size: req.file.size,
        },
      });
    } catch (e) { next(e); }
  }
}

export default new SocialPostController();
