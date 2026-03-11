import NotificationPreference from './preference.model.js';

class PreferenceService {
  async getByUser(userId) {
    let prefs = await NotificationPreference.findOne({ user: userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: userId });
    }
    return prefs;
  }

  async update(userId, data) {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: userId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
    return prefs;
  }

  async shouldNotify(userId, type, channel) {
    const prefs = await this.getByUser(userId);
    return prefs[channel]?.[type] !== false;
  }
}

export default new PreferenceService();
