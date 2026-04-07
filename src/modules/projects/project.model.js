import mongoose from 'mongoose';
import Counter from './counter.model.js';

const projectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Untitled Project',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: [String],
      enum: ['fixed_cost', 'time_and_material', 'retainer'],
      default: [],
    },
    recurringAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed'],
      default: 'planning',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    projectManagers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    developers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    githubLinks: [
      {
        label: { type: String, trim: true, default: '' },
        url: { type: String, trim: true },
      },
    ],
    domains: [
      {
        type: String,
        enum: [
          'coded_website_static', 'coded_web_app', 'coded_software_system', 'coded_app',
          'shopify', 'wordpress', 'ai_development', 'automation', 'blockchain',
          'ecommerce', 'api_integration', 'cloud_infrastructure', 'ui_ux_design',
          'data_analytics', 'devops', 'cyber_security',
        ],
      },
    ],
    revenues: [
      {
        category: {
          type: String,
          enum: ['development', 'maintenance', 'custom'],
          required: true,
        },
        customLabel: { type: String, trim: true, default: '' },
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, default: Date.now },
        notes: { type: String, trim: true, default: '' },
      },
    ],
    stageRestrictions: {
      type: Map,
      of: [String],
      default: {},
    },
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

// Auto-generate project code before save
projectSchema.pre('save', async function () {
  if (!this.code) {
    const seq = await Counter.getNextSequence('project_code');
    this.code = `PRJ-${String(seq).padStart(3, '0')}`;
  }
});

projectSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Indexes
projectSchema.index({ status: 1 });
projectSchema.index({ projectManagers: 1 });
projectSchema.index({ developers: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ domains: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
