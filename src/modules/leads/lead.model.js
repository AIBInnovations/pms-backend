import mongoose from 'mongoose';
import Counter from '../projects/counter.model.js';

const internalNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true },
    company: { type: String, trim: true, default: '' },
    contactName: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },

    source: {
      type: String,
      enum: ['website', 'email', 'referral', 'cold_outreach', 'social', 'event', 'other'],
      default: 'other',
    },

    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
      default: 'new',
    },

    pipeline: {
      type: String,
      enum: ['new_business', 'upsell', 'renewal', 'partnership'],
      default: 'new_business',
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    budgetRange: {
      type: String,
      enum: ['under_50k', '50k_2l', '2l_10l', 'above_10l', ''],
      default: '',
    },

    dealValue: { type: Number, default: 0, min: 0 },

    serviceInterest: [
      {
        type: String,
        enum: ['web_app', 'mobile_app', 'shopify', 'ai', 'automation', 'other'],
      },
    ],

    priority: { type: Boolean, default: false }, // High Priority flag

    leadScore: { type: Number, default: 0, min: 0, max: 100 },

    tags: [{ type: String, trim: true }],

    description: { type: String, trim: true, default: '' },
    internalNotes: [internalNoteSchema],

    // Outbound outreach fields (populated by CSV import or manually)
    postLink: { type: String, trim: true, default: '' },
    conversationLink: { type: String, trim: true, default: '' },
    proposalNote: { type: String, trim: true, default: '' },

    // Lost / archive tracking
    lostReason: {
      type: String,
      enum: ['price', 'timeline', 'no_response', 'chose_competitor', 'other', ''],
      default: '',
    },
    lostReasonNote: { type: String, trim: true, default: '' },

    // Pipeline timing
    stageEnteredAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },

    // Follow-up reminder
    nextFollowUpAt: { type: Date, default: null },

    // Conversion to project
    convertedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate lead ID
leadSchema.pre('save', async function () {
  if (!this.leadId) {
    const seq = await Counter.getNextSequence('lead');
    this.leadId = `LEAD-${String(seq).padStart(4, '0')}`;
  }
});

// Update stageEnteredAt when status changes
leadSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.stageEnteredAt = new Date();
  }
  next();
});

leadSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

leadSchema.index({ status: 1 });
leadSchema.index({ pipeline: 1, status: 1 });
leadSchema.index({ assignee: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ priority: -1 });
leadSchema.index({ nextFollowUpAt: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ conversationLink: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
