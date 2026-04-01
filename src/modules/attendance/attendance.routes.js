import { Router } from 'express';
import controller from './attendance.controller.js';
import { auth, rbac, validate } from '../../middleware/index.js';
import { checkInSchema, checkOutSchema, attendanceQuerySchema, registerIpSchema } from './attendance.validation.js';

const router = Router();

router.use(auth);

// Any authenticated non-admin user
router.post('/check-in', validate(checkInSchema), controller.checkIn.bind(controller));
router.post('/check-out', validate(checkOutSchema), controller.checkOut.bind(controller));
router.get('/today', controller.getToday.bind(controller));
router.get('/summary', controller.getMonthlySummary.bind(controller));
router.get('/', validate(attendanceQuerySchema, 'query'), controller.getAll.bind(controller));

// Admin only
router.get('/today-all', rbac('super_admin'), controller.getTodayAll.bind(controller));
router.post('/register-ip', rbac('super_admin'), validate(registerIpSchema), controller.registerIp.bind(controller));
router.delete('/ip/:userId/:ip', rbac('super_admin'), controller.removeIp.bind(controller));

export default router;
