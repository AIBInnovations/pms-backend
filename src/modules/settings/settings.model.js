import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    appName: { type: String, default: 'PMS' },
    logo: { type: String, default: '' },
    defaultProjectType: { type: String, default: 'time_and_material' },
    defaultTaskPriority: { type: String, default: 'medium' },
    maxFileSize: { type: Number, default: 10 }, // MB
    allowedFileTypes: [{ type: String }],
    maintenanceMode: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

settingsSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Ensure only one settings document exists (singleton pattern)
settingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
