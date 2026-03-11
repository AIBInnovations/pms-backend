import mongoose from 'mongoose';
import Counter from '../projects/counter.model.js';

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const bugSchema = new mongoose.Schema(
  {
    bugId: {
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
      required: [true, 'Bug title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: ['critical', 'major', 'minor', 'trivial'],
      default: 'minor',
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'fixed', 'verified', 'closed', 'reopened', 'wont_fix'],
      default: 'open',
    },
    environment: {
      type: String,
      trim: true,
      default: '',
    },
    stepsToReproduce: {
      type: String,
      trim: true,
      default: '',
    },
    expectedResult: {
      type: String,
      trim: true,
      default: '',
    },
    actualResult: {
      type: String,
      trim: true,
      default: '',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    dueDate: {
      type: Date,
    },
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
  }
);

// Auto-generate bug ID before save (e.g., PRJ-B0001)
bugSchema.pre('save', async function () {
  if (!this.bugId) {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.project).select('code');
    const seq = await Counter.getNextSequence(`bug_${this.project}`);
    this.bugId = `${project?.code || 'BUG'}-B${String(seq).padStart(4, '0')}`;
  }
});

bugSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Indexes
bugSchema.index({ project: 1, status: 1 });
bugSchema.index({ severity: 1 });
bugSchema.index({ assignee: 1 });
bugSchema.index({ reporter: 1 });
bugSchema.index({ relatedTask: 1 });

const Bug = mongoose.model('Bug', bugSchema);

export default Bug;
