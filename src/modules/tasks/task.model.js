import mongoose from 'mongoose';
import Counter from '../projects/counter.model.js';

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    checked: { type: Boolean, default: false },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      unique: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['feature', 'bug', 'improvement', 'research', 'deployment'],
      default: 'feature',
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    stage: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'archived'],
      default: 'backlog',
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dueDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastCommentAt: {
      type: Date,
      default: null,
    },
    blockedReason: {
      type: String,
      trim: true,
      default: '',
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },
    checklists: [checklistItemSchema],
    attachments: [attachmentSchema],
    stageHistory: [
      {
        from: { type: String },
        to: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate task ID before save (e.g., PRJ-0001)
taskSchema.pre('save', async function () {
  if (!this.taskId) {
    const project = await mongoose.model('Project').findById(this.project).select('code');
    const counterName = `task_${this.project}`;
    const seq = await Counter.getNextSequence(counterName);
    this.taskId = `${project?.code || 'TASK'}-${String(seq).padStart(4, '0')}`;
  }
});

taskSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Indexes
taskSchema.index({ project: 1, stage: 1 });
taskSchema.index({ project: 1, priority: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ stage: 1 });
taskSchema.index({ dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
