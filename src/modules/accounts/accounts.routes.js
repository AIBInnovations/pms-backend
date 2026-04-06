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
router.delete('/withdrawals/:id', controller.deleteWithdrawal.bind(controller));

export default router;
