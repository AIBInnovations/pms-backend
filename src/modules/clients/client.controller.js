import clientService from './client.service.js';
import { sendSuccess } from '../../utils/index.js';

class ClientController {
  async getAll(req, res, next) {
    try {
      const data = await clientService.getAll(req.query);
      sendSuccess(res, { data });
    } catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const client = await clientService.getById(req.params.id);
      sendSuccess(res, { data: client });
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const client = await clientService.create(req.body, req.user.id || req.user._id);
      sendSuccess(res, { data: client, message: 'Client created' }, 201);
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const client = await clientService.update(req.params.id, req.body);
      sendSuccess(res, { data: client, message: 'Client updated' });
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try {
      await clientService.delete(req.params.id);
      sendSuccess(res, { message: 'Client deleted' });
    } catch (e) { next(e); }
  }

  async addNote(req, res, next) {
    try {
      const client = await clientService.addNote(req.params.id, req.body.text, req.user.id || req.user._id);
      sendSuccess(res, { data: client, message: 'Note added' });
    } catch (e) { next(e); }
  }

  async deleteNote(req, res, next) {
    try {
      await clientService.deleteNote(req.params.id, req.params.noteId);
      sendSuccess(res, { message: 'Note deleted' });
    } catch (e) { next(e); }
  }
}

export default new ClientController();
