import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // 'created', 'updated', 'deleted', 'transitioned', 'commented', 'uploaded'
  targetType: { type: String, enum: ['Task', 'Bug', 'Project', 'Document', 'Comment'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetTitle: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }, // e.g. { from: 'todo', to: 'in_progress' }
}, { timestamps: true });

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
