import { Router } from 'express';
import mongoose from 'mongoose';
import { auth } from '../../middleware/index.js';
import { sendSuccess } from '../../utils/index.js';

const router = Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.validQuery || req.query;
    if (!q || q.length < 2) {
      return sendSuccess(res, { data: { tasks: [], projects: [], documents: [] } });
    }

    const regex = { $regex: q, $options: 'i' };
    const maxResults = Math.min(Number(limit), 10);

    const Task = mongoose.model('Task');
    const Project = mongoose.model('Project');
    const Document = mongoose.model('Document');

    const [tasks, projects, documents] = await Promise.all([
      Task.find({ $or: [{ title: regex }, { taskId: regex }] })
        .select('taskId title stage type project')
        .populate('project', 'code')
        .limit(maxResults),
      Project.find({ $or: [{ name: regex }, { code: regex }] })
        .select('code name status')
        .limit(maxResults),
      Document.find({ title: regex })
        .select('title category project')
        .populate('project', 'code')
        .limit(maxResults),
    ]);

    sendSuccess(res, { data: { tasks, projects, documents } });
  } catch (error) {
    next(error);
  }
});

export default router;
