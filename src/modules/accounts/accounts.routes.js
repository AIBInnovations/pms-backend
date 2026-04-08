import { Router } from 'express';
import controller from './accounts.controller.js';
import { auth, rbac } from '../../middleware/index.js';

const router = Router();
router.use(auth);
router.use(rbac('super_admin'));

// Summary
router.get('/summary', controller.getSummary.bind(controller));
router.get('/receivables', controller.getReceivables.bind(controller));

// Payments
router.get('/payments', controller.getPayments.bind(controller));
router.post('/payments', controller.addPayment.bind(controller));
router.patch('/payments/:id', controller.updatePayment.bind(controller));
router.delete('/payments/:id', controller.deletePayment.bind(controller));

// Expenses
router.get('/expenses', controller.getExpenses.bind(controller));
router.post('/expenses', controller.addExpense.bind(controller));
router.patch('/expenses/:id', controller.updateExpense.bind(controller));
router.delete('/expenses/:id', controller.deleteExpense.bind(controller));

// Withdrawals
router.get('/withdrawals', controller.getWithdrawals.bind(controller));
router.post('/withdrawals', controller.addWithdrawal.bind(controller));
router.patch('/withdrawals/:id', controller.updateWithdrawal.bind(controller));
router.post('/withdrawals/:id/settle', controller.settleWithdrawal.bind(controller));
router.post('/withdrawals/:id/unsettle', controller.unsettleWithdrawal.bind(controller));
router.delete('/withdrawals/:id', controller.deleteWithdrawal.bind(controller));

// Recurring Plans
router.get('/recurring', controller.getRecurringPlans.bind(controller));
router.post('/recurring', controller.addRecurringPlan.bind(controller));
router.patch('/recurring/:id', controller.updateRecurringPlan.bind(controller));
router.delete('/recurring/:id', controller.deleteRecurringPlan.bind(controller));

// Invoices
router.get('/invoices', controller.getInvoices.bind(controller));
router.post('/invoices', controller.generateInvoice.bind(controller));
router.patch('/invoices/:id', controller.updateInvoice.bind(controller));
router.post('/invoices/:id/pay', controller.markInvoicePaid.bind(controller));
router.delete('/invoices/:id', controller.deleteInvoice.bind(controller));

export default router;
