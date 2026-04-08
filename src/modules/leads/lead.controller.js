import leadService from './lead.service.js';
import { sendSuccess, AppError } from '../../utils/index.js';

class LeadController {
  async getAll(req, res, next) {
    try {
      const query = req.validQuery || req.query;
      const userId = req.user.id || req.user._id;
      const { records, meta } = await leadService.getAll(query, userId, req.user.role);
      sendSuccess(res, { data: records, meta });
    } catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const lead = await leadService.getById(req.params.id);
      sendSuccess(res, { data: lead });
    } catch (e) { next(e); }
  }

  async checkDuplicate(req, res, next) {
    try {
      const lead = await leadService.checkDuplicate(req.query.email, req.query.company);
      sendSuccess(res, { data: lead });
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const lead = await leadService.create(req.body, req.user.id || req.user._id);
      sendSuccess(res, { data: lead, message: 'Lead created' }, 201);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const lead = await leadService.update(req.params.id, req.body);
      sendSuccess(res, { data: lead, message: 'Lead updated' });
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try {
      await leadService.delete(req.params.id);
      sendSuccess(res, { message: 'Lead deleted' });
    } catch (e) { next(e); }
  }

  async addNote(req, res, next) {
    try {
      const lead = await leadService.addNote(req.params.id, req.body.text, req.user.id || req.user._id);
      sendSuccess(res, { data: lead, message: 'Note added' });
    } catch (e) { next(e); }
  }

  async deleteNote(req, res, next) {
    try {
      await leadService.deleteNote(req.params.id, req.params.noteId);
      sendSuccess(res, { message: 'Note deleted' });
    } catch (e) { next(e); }
  }

  async convertToProject(req, res, next) {
    try {
      const result = await leadService.convertToProject(req.params.id, req.body, req.user.id || req.user._id);
      sendSuccess(res, { data: result, message: 'Lead converted to project' }, 201);
    } catch (e) { next(e); }
  }

  async previewImport(req, res, next) {
    try {
      if (!req.file?.buffer) throw new AppError('CSV file is required', 400, 'NO_FILE');
      const csv = req.file.buffer.toString('utf8');
      sendSuccess(res, { data: await leadService.previewCsv(csv) });
    } catch (e) { next(e); }
  }

  async commitImport(req, res, next) {
    try {
      if (!req.file?.buffer) throw new AppError('CSV file is required', 400, 'NO_FILE');
      const csv = req.file.buffer.toString('utf8');
      const userId = req.user.id || req.user._id;
      const result = await leadService.importFromCsv(csv, userId);
      sendSuccess(res, { data: result, message: `Imported ${result.created} of ${result.total} leads` });
    } catch (e) { next(e); }
  }
}

export default new LeadController();
