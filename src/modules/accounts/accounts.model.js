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
    settled: { type: Boolean, default: false },
    settledAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

withdrawalSchema.index({ person: 1, date: -1 });
withdrawalSchema.index({ date: -1 });

// ─── Recurring Plans (project payment structure) ─────
const recurringPlanSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    setupFee: { type: Number, default: 0, min: 0 },
    setupFeePaid: { type: Boolean, default: false },
    recurringAmount: { type: Number, required: true, min: 0 },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    startDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

recurringPlanSchema.index({ project: 1 });
recurringPlanSchema.index({ status: 1 });

// ─── Invoices ────────────────────────────────────────
const invoiceSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    recurringPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringPlan',
    },
    linkedProposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    invoiceNumber: { type: String, unique: true },
    type: {
      type: String,
      enum: ['setup', 'recurring', 'one_time'],
      required: true,
    },
    period: { type: String, default: '' }, // "2026-04" for monthly
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue'],
      default: 'draft',
    },
    dueDate: { type: Date },
    paidDate: { type: Date },
    paidAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: '' },
    paymentReference: { type: String, default: '' },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

invoiceSchema.index({ project: 1, period: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ recurringPlan: 1 });

// Auto-generate invoice number
invoiceSchema.pre('save', async function () {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
  }
});

export const Payment = mongoose.model('Payment', paymentSchema);
export const Expense = mongoose.model('Expense', expenseSchema);
export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export const RecurringPlan = mongoose.model('RecurringPlan', recurringPlanSchema);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
