import mongoose from 'mongoose';
import Counter from '../projects/counter.model.js';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    type: { type: String, enum: ['one_time', 'recurring'], default: 'one_time' },
  },
  { _id: true }
);

const paymentMilestoneSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    percentage: { type: Number, min: 0, max: 100 },
    amount: { type: Number, min: 0 },
    dueOn: { type: String, default: '' }, // free text: "On signing", "Mid-delivery", etc.
  },
  { _id: true }
);

const versionSnapshotSchema = new mongoose.Schema(
  {
    version: Number,
    title: String,
    summary: String,
    lineItems: [lineItemSchema],
    discountType: String,
    discountValue: Number,
    paymentTerms: [paymentMilestoneSchema],
    validityDate: Date,
    notes: String,
    revisionNote: String,
    snapshotAt: { type: Date, default: Date.now },
    snapshotBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const proposalSchema = new mongoose.Schema(
  {
    proposalNumber: { type: String, unique: true },

    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },

    title: { type: String, required: true, trim: true, maxlength: 300 },
    summary: { type: String, trim: true, default: '' },

    lineItems: [lineItemSchema],

    discountType: { type: String, enum: ['percentage', 'fixed', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0, min: 0 },

    paymentTerms: [paymentMilestoneSchema],

    validityDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },

    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected'],
      default: 'draft',
    },

    rejectionReason: { type: String, trim: true, default: '' },

    version: { type: Number, default: 1 },
    versions: [versionSnapshotSchema],

    isTemplate: { type: Boolean, default: false },
    templateName: { type: String, trim: true, default: '' },

    sentAt: { type: Date, default: null },
    viewedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

proposalSchema.pre('save', async function () {
  if (!this.proposalNumber) {
    const seq = await Counter.getNextSequence('proposal');
    this.proposalNumber = `PRO-${String(seq).padStart(4, '0')}`;
  }
});

proposalSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

proposalSchema.index({ lead: 1 });
proposalSchema.index({ client: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ isTemplate: 1 });

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
