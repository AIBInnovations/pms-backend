import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    email: {
      task_assigned: { type: Boolean, default: true },
      bug_assigned: { type: Boolean, default: true },
      comment_mention: { type: Boolean, default: true },
      deadline_approaching: { type: Boolean, default: true },
      status_change: { type: Boolean, default: false },
      comment_reply: { type: Boolean, default: true },
    },
    inApp: {
      task_assigned: { type: Boolean, default: true },
      bug_assigned: { type: Boolean, default: true },
      comment_mention: { type: Boolean, default: true },
      deadline_approaching: { type: Boolean, default: true },
      status_change: { type: Boolean, default: true },
      comment_reply: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

preferenceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const NotificationPreference = mongoose.model('NotificationPreference', preferenceSchema);

export default NotificationPreference;
