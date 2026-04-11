import { Payment, Expense, Withdrawal, RecurringPlan, Invoice } from './accounts.model.js';
import { AppError } from '../../utils/index.js';

class AccountsService {
  // ─── Dashboard / Summary ───────────────────────────
  async getSummary(month) {
    const dateFilter = month ? { date: { $regex: `^${month}` } } : {};
    // For date filter with Date type, use range
    let dateRange = {};
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      dateRange = { date: { $gte: start, $lt: end } };
    }

    const [payments, expenses, withdrawals, allPayments, allExpenses, allWithdrawals] = await Promise.all([
      Payment.aggregate([{ $match: dateRange }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: dateRange }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Withdrawal.aggregate([{ $match: { ...dateRange, settled: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      // All-time totals for balance
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Withdrawal.aggregate([{ $match: { settled: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const periodReceived = payments[0]?.total || 0;
    const periodExpenses = expenses[0]?.total || 0;
    const periodWithdrawals = withdrawals[0]?.total || 0;

    const totalReceived = allPayments[0]?.total || 0;
    const totalExpenses = allExpenses[0]?.total || 0;
    const totalWithdrawals = allWithdrawals[0]?.total || 0;
    const availableBalance = totalReceived - totalExpenses - totalWithdrawals;

    // Withdrawal breakdown by person (all-time)
    const withdrawalByPerson = await Withdrawal.aggregate([
      { $match: { settled: { $ne: true } } },
      { $group: { _id: '$person', total: { $sum: '$amount' } } },
    ]);
    const founderWithdrawals = {};
    for (const w of withdrawalByPerson) {
      founderWithdrawals[w._id] = w.total;
    }

    // Expense breakdown by category (period)
    const expenseByCategory = await Expense.aggregate([
      { $match: dateRange },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    // Revenue by project (period)
    const revenueByProject = await Payment.aggregate([
      { $match: dateRange },
      { $group: { _id: '$project', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
      { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
      { $project: { total: 1, 'project.name': 1, 'project.code': 1 } },
    ]);

    return {
      period: { received: periodReceived, expenses: periodExpenses, withdrawals: periodWithdrawals },
      allTime: { received: totalReceived, expenses: totalExpenses, withdrawals: totalWithdrawals },
      availableBalance,
      founderWithdrawals,
      expenseByCategory,
      revenueByProject,
    };
  }

  // ─── Receivables (project-level: this month's expected vs received) ──
  async getReceivables() {
    const Project = (await import('../projects/project.model.js')).default;
    const projects = await Project.find({ status: { $ne: 'completed' } }).select('name code budget').lean();

    // Current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Payments received THIS MONTH per project
    const paymentsByProject = await Payment.aggregate([
      { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: '$project', received: { $sum: '$amount' } } },
    ]);
    const receivedMap = {};
    for (const p of paymentsByProject) {
      receivedMap[p._id.toString()] = p.received;
    }

    // Recurring plans — this month's expected amount only (no accumulation)
    const plans = await RecurringPlan.find({ status: 'active' }).lean();
    const recurringMap = {};
    for (const plan of plans) {
      const pid = plan.project.toString();
      let monthlyDue = 0;
      if (plan.frequency === 'monthly') {
        monthlyDue = plan.recurringAmount || 0;
      } else if (plan.frequency === 'quarterly') {
        // Due in first month of each quarter (Jan, Apr, Jul, Oct)
        if (now.getMonth() % 3 === 0) monthlyDue = plan.recurringAmount || 0;
      } else if (plan.frequency === 'yearly') {
        // Due in the start month
        const startMonth = new Date(plan.startDate).getMonth();
        if (now.getMonth() === startMonth) monthlyDue = plan.recurringAmount || 0;
      }
      recurringMap[pid] = (recurringMap[pid] || 0) + monthlyDue;
    }

    return projects.map((p) => {
      const pid = p._id.toString();
      const received = receivedMap[pid] || 0;
      // This month's expected = recurring amount due this month
      // For non-recurring projects, use budget as expected (one-time)
      const expected = recurringMap[pid] || p.budget || 0;
      const receivable = Math.max(0, expected - received);
      return {
        project: { _id: p._id, name: p.name, code: p.code },
        expected,
        received,
        receivable,
      };
    }).filter((p) => p.expected > 0 || p.received > 0);
  }

  // ─── Payments CRUD ─────────────────────────────────
  async getPayments(query = {}) {
    const { project, page = 1, limit = 50 } = query;
    const filter = project ? { project } : {};
    const [records, total] = await Promise.all([
      Payment.find(filter).populate('project', 'name code').populate('createdBy', 'name').sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
      Payment.countDocuments(filter),
    ]);
    return { records, total };
  }

  async addPayment(data, userId) {
    return Payment.create({ ...data, createdBy: userId });
  }

  async updatePayment(id, data) {
    const doc = await Payment.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!doc) throw new AppError('Payment not found', 404, 'NOT_FOUND');
    return doc;
  }

  async deletePayment(id) {
    const doc = await Payment.findByIdAndDelete(id);
    if (!doc) throw new AppError('Payment not found', 404, 'NOT_FOUND');
    return doc;
  }

  // ─── Expenses CRUD ─────────────────────────────────
  async getExpenses(query = {}) {
    const { category, page = 1, limit = 50 } = query;
    const filter = category ? { category } : {};
    const [records, total] = await Promise.all([
      Expense.find(filter).populate('createdBy', 'name').sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
      Expense.countDocuments(filter),
    ]);
    return { records, total };
  }

  async addExpense(data, userId) {
    return Expense.create({ ...data, createdBy: userId });
  }

  async updateExpense(id, data) {
    const doc = await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!doc) throw new AppError('Expense not found', 404, 'NOT_FOUND');
    return doc;
  }

  async deleteExpense(id) {
    const doc = await Expense.findByIdAndDelete(id);
    if (!doc) throw new AppError('Expense not found', 404, 'NOT_FOUND');
    return doc;
  }

  // ─── Withdrawals CRUD ──────────────────────────────
  async getWithdrawals(query = {}) {
    const { person, page = 1, limit = 50 } = query;
    const filter = person ? { person } : {};
    const [records, total] = await Promise.all([
      Withdrawal.find(filter).populate('createdBy', 'name').sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
      Withdrawal.countDocuments(filter),
    ]);
    return { records, total };
  }

  async addWithdrawal(data, userId) {
    return Withdrawal.create({ ...data, createdBy: userId });
  }

  async updateWithdrawal(id, data) {
    const doc = await Withdrawal.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!doc) throw new AppError('Withdrawal not found', 404, 'NOT_FOUND');
    return doc;
  }

  async deleteWithdrawal(id) {
    const doc = await Withdrawal.findByIdAndDelete(id);
    if (!doc) throw new AppError('Withdrawal not found', 404, 'NOT_FOUND');
    return doc;
  }

  async settleWithdrawal(id) {
    const doc = await Withdrawal.findByIdAndUpdate(
      id,
      { settled: true, settledAt: new Date() },
      { new: true }
    );
    if (!doc) throw new AppError('Withdrawal not found', 404, 'NOT_FOUND');
    return doc;
  }

  async unsettleWithdrawal(id) {
    const doc = await Withdrawal.findByIdAndUpdate(
      id,
      { settled: false, settledAt: null },
      { new: true }
    );
    if (!doc) throw new AppError('Withdrawal not found', 404, 'NOT_FOUND');
    return doc;
  }

  // ─── Recurring Plans ───────────────────────────────
  async getRecurringPlans() {
    return RecurringPlan.find()
      .populate('project', 'name code status')
      .sort({ status: 1, createdAt: -1 });
  }

  async addRecurringPlan(data, userId) {
    return RecurringPlan.create({ ...data, createdBy: userId });
  }

  async updateRecurringPlan(id, data) {
    const doc = await RecurringPlan.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('project', 'name code status');
    if (!doc) throw new AppError('Plan not found', 404, 'NOT_FOUND');
    return doc;
  }

  async deleteRecurringPlan(id) {
    const doc = await RecurringPlan.findByIdAndDelete(id);
    if (!doc) throw new AppError('Plan not found', 404, 'NOT_FOUND');
    // Also delete related invoices
    await Invoice.deleteMany({ recurringPlan: id });
    return doc;
  }

  // ─── Invoices ──────────────────────────────────────
  async getInvoices(query = {}) {
    const { project, recurringPlan, status, limit = 100 } = query;
    const filter = {};
    if (project) filter.project = project;
    if (recurringPlan) filter.recurringPlan = recurringPlan;
    if (status) filter.status = status;
    return Invoice.find(filter)
      .populate('project', 'name code')
      .populate('recurringPlan')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async generateInvoice(data, userId) {
    // Check for duplicate period invoice on same plan
    if (data.recurringPlan && data.period) {
      const existing = await Invoice.findOne({ recurringPlan: data.recurringPlan, period: data.period });
      if (existing) throw new AppError(`Invoice for ${data.period} already exists`, 400, 'DUPLICATE_INVOICE');
    }
    return Invoice.create({ ...data, createdBy: userId });
  }

  async updateInvoice(id, data) {
    const doc = await Invoice.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('project', 'name code');
    if (!doc) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    return doc;
  }

  async markInvoicePaid(id, paymentData) {
    const invoice = await Invoice.findById(id);
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');

    invoice.status = 'paid';
    invoice.paidDate = paymentData.paidDate || new Date();
    invoice.paidAmount = paymentData.paidAmount || invoice.amount;
    invoice.paymentMethod = paymentData.paymentMethod || '';
    invoice.paymentReference = paymentData.paymentReference || '';
    await invoice.save();

    // Also record as an incoming payment
    await Payment.create({
      project: invoice.project,
      amount: invoice.paidAmount,
      date: invoice.paidDate,
      description: `Invoice ${invoice.invoiceNumber} — ${invoice.type === 'setup' ? 'Setup Fee' : invoice.period}`,
      paymentMethod: invoice.paymentMethod || 'bank_transfer',
      reference: invoice.paymentReference,
      createdBy: paymentData.userId,
    });

    // If setup invoice, mark plan setupFeePaid
    if (invoice.type === 'setup' && invoice.recurringPlan) {
      await RecurringPlan.findByIdAndUpdate(invoice.recurringPlan, { setupFeePaid: true });
    }

    return Invoice.findById(id).populate('project', 'name code');
  }

  async deleteInvoice(id) {
    const doc = await Invoice.findByIdAndDelete(id);
    if (!doc) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    return doc;
  }
}

export default new AccountsService();
