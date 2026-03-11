import Settings from './settings.model.js';

class SettingsService {
  async get() {
    return Settings.getInstance();
  }

  async update(data) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    return settings;
  }
}

export default new SettingsService();
