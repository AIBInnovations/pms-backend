import { Router } from 'express';
import settingsController from './settings.controller.js';
import { auth, validate, rbac } from '../../middleware/index.js';
import { updateSettingsSchema } from './settings.validation.js';

const router = Router();

router.use(auth);

router.get('/', settingsController.get.bind(settingsController));

router.patch(
  '/',
  rbac('super_admin'),
  validate(updateSettingsSchema),
  settingsController.update.bind(settingsController)
);

export default router;
