import accountsService from './accounts.service.js';
import { sendSuccess } from '../../utils/index.js';

class AccountsController {
  async getSummary(req, res, next) {
    try {
      const summary = await accountsService.getSummary(req.query.month);
      sendSuccess(res, { data: summary });
    } catch (error) { next(error); }
  }

  async getReceivables(req, res, next) {
    try {
      const data = await accountsService.getReceivables();
      sendSuccess(res, { data });
    } catch (error) { next(error); }
  }

  // Payments
  async getPayments(req, res, next) {
    try {
      const { records, total } = await accountsService.getPayments(req.query);
      sendSuccess(res, { data: records, meta: { total } });
    } catch (error) { next(error); }
  }
  async addPayment(req, res, next) {
    try {
      const doc = await accountsService.addPayment(req.body, req.user.id || req.user._id);
      sendSuccess(res, { data: doc, message: 'Payment recorded' }, 201);
    } catch (error) { next(error); }
  }
  async updatePayment(req, res, next) {
    try {
      const doc = await accountsService.updatePayment(req.params.id, req.body);
      sendSuccess(res, { data: doc, message: 'Payment updated' });
    } catch (error) { next(error); }
  }
  async deletePayment(req, res, next) {
    try {
      await accountsService.deletePayment(req.params.id);
      sendSuccess(res, { message: 'Payment deleted' });
    } catch (error) { next(error); }
  }

  // Expenses
  async getExpenses(req, res, next) {
    try {
      const { records, total } = await accountsService.getExpenses(req.query);
      sendSuccess(res, { data: records, meta: { total } });
    } catch (error) { next(error); }
  }
  async addExpense(req, res, next) {
    try {
      const doc = await accountsService.addExpense(req.body, req.user.id || req.user._id);
      sendSuccess(res, { data: doc, message: 'Expense recorded' }, 201);
    } catch (error) { next(error); }
  }
  async updateExpense(req, res, next) {
    try {
      const doc = await accountsService.updateExpense(req.params.id, req.body);
      sendSuccess(res, { data: doc, message: 'Expense updated' });
    } catch (error) { next(error); }
  }
  async deleteExpense(req, res, next) {
    try {
      await accountsService.deleteExpense(req.params.id);
      sendSuccess(res, { message: 'Expense deleted' });
    } catch (error) { next(error); }
  }

  // Withdrawals
  async getWithdrawals(req, res, next) {
    try {
      const { records, total } = await accountsService.getWithdrawals(req.query);
      sendSuccess(res, { data: records, meta: { total } });
    } catch (error) { next(error); }
  }
  async addWithdrawal(req, res, next) {
    try {
      const doc = await accountsService.addWithdrawal(req.body, req.user.id || req.user._id);
      sendSuccess(res, { data: doc, message: 'Withdrawal recorded' }, 201);
    } catch (error) { next(error); }
  }
  async updateWithdrawal(req, res, next) {
    try {
      const doc = await accountsService.updateWithdrawal(req.params.id, req.body);
      sendSuccess(res, { data: doc, message: 'Withdrawal updated' });
    } catch (error) { next(error); }
  }
  async deleteWithdrawal(req, res, next) {
    try {
      await accountsService.deleteWithdrawal(req.params.id);
      sendSuccess(res, { message: 'Withdrawal deleted' });
    } catch (error) { next(error); }
  }
}

export default new AccountsController();
