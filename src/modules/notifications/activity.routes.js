import { Router } from 'express';
import activityService from './activity.service.js';
import { auth } from '../../middleware/index.js';
import { sendSuccess } from '../../utils/index.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const data = await activityService.getGlobal(req.validQuery || req.query);
    sendSuccess(res, { data: data.activities, meta: data.meta });
  } catch (error) { next(error); }
});

router.get('/project/:projectId', async (req, res, next) => {
  try {
    const data = await activityService.getByProject(req.params.projectId, req.validQuery || req.query);
    sendSuccess(res, { data: data.activities, meta: data.meta });
  } catch (error) { next(error); }
});

export default router;
