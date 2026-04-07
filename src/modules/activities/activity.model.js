import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'whatsapp', 'demo', 'proposal_discussion', 'negotiation', 'check_in', 'other'],
      required: true,
    },
    outcome: {
      type: String,
      enum: ['interested', 'not_interested', 'followup_needed', 'closed', ''],
      default: '',
    },
    notes: { type: String, trim: true, default: '' },
    nextAction: { type: String, trim: true, default: '' },
    nextActionDate: { type: Date, default: null },
    completed: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

activitySchema.index({ lead: 1, createdAt: -1 });
activitySchema.index({ nextActionDate: 1, completed: 1 });
activitySchema.index({ createdBy: 1 });

activitySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
