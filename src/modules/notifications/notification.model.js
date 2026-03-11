import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'comment_mention',
        'bug_assigned',
        'deadline_approaching',
        'status_change',
        'comment_reply',
        'general',
      ],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 300,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    read: {
      type: Boolean,
      default: false,
    },
    entityType: {
      type: String,
      enum: ['Task', 'Bug', 'Project', 'Document', 'Comment'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    link: {
      type: String,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
