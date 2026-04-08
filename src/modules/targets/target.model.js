import mongoose from 'mongoose';

const targetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['firm', 'user'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null when type === 'firm'
    },
    period: {
      type: String,
      enum: ['month', 'quarter'],
      required: true,
    },
    // Period identifier — "2026-04" for month, "2026-Q2" for quarter
    periodKey: { type: String, required: true },

    leadsTarget: { type: Number, default: 0, min: 0 },
    proposalsTarget: { type: Number, default: 0, min: 0 },
    dealsTarget: { type: Number, default: 0, min: 0 },
    revenueTarget: { type: Number, default: 0, min: 0 },

    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

targetSchema.index({ type: 1, periodKey: 1 });
targetSchema.index({ user: 1, periodKey: 1 });

targetSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Target = mongoose.model('Target', targetSchema);

export default Target;
