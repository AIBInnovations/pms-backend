import documentService from './document.service.js';
import { sendSuccess } from '../../utils/index.js';

class DocumentController {
  async getAll(req, res, next) {
    try {
      const { documents, meta } = await documentService.getAll(req.validQuery || req.query);
      sendSuccess(res, { data: documents, meta });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const document = await documentService.getById(req.params.id);
      sendSuccess(res, { data: document });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const document = await documentService.create(req.body, req.user.id);
      sendSuccess(res, { data: document, message: 'Document created successfully', statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const document = await documentService.update(req.params.id, req.body, req.user.id);
      sendSuccess(res, { data: document, message: 'Document updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await documentService.delete(req.params.id);
      sendSuccess(res, { message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getVersionHistory(req, res, next) {
    try {
      const document = await documentService.getVersionHistory(req.params.id);
      sendSuccess(res, { data: document });
    } catch (error) {
      next(error);
    }
  }

  async restoreVersion(req, res, next) {
    try {
      const versionNumber = parseInt(req.params.versionNumber, 10);
      const document = await documentService.restoreVersion(req.params.id, versionNumber, req.user.id);
      sendSuccess(res, { data: document, message: 'Version restored successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentController();
