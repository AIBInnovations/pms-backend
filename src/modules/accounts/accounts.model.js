import mongoose from 'mongoose';

// ─── Incoming Payments (project-linked) ──────────────
const paymentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String, trim: true, default: '' },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cash', 'cheque', 'other'],
      default: 'bank_transfer',
    },
    reference: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ project: 1, date: -1 });
paymentSchema.index({ date: -1 });

// ─── Expenses (company-wide, NOT project-linked) ─────
const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['salaries', 'freelancer', 'software_tools', 'hosting', 'marketing', 'office', 'travel', 'miscellaneous'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String, trim: true, default: '' },
    paidTo: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

// ─── Founder Withdrawals ─────────────────────────────
const withdrawalSchema = new mongoose.Schema(
  {
    person: {
      type: String,
      enum: ['akshat', 'bhavya'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

withdrawalSchema.index({ person: 1, date: -1 });
withdrawalSchema.index({ date: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
export const Expense = mongoose.model('Expense', expenseSchema);
export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
