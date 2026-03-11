import settingsService from './settings.service.js';
import { sendSuccess } from '../../utils/index.js';

class SettingsController {
  async get(req, res, next) {
    try {
      const settings = await settingsService.get();
      sendSuccess(res, { data: settings });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const settings = await settingsService.update(req.body);
      sendSuccess(res, { data: settings, message: 'Settings updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
