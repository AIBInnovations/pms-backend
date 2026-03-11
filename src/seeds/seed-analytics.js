import mongoose from 'mongoose';
import { env, logger } from '../config/index.js';
import User from '../modules/users/user.model.js';
import Project from '../modules/projects/project.model.js';
import Task from '../modules/tasks/task.model.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000);
const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Build a realistic stage history for a task
function buildHistory(pattern, createdAt, devId, pmId) {
  const entries = [];
  let time = new Date(createdAt.getTime() + randomBetween(1, 4) * 3600000);

  for (const [from, to] of pattern) {
    entries.push({
      from,
      to,
      changedBy: ['in_review', 'testing', 'done'].includes(to) && from === 'in_progress' ? devId :
                 ['todo', 'in_progress'].includes(to) && from === 'in_review' ? pmId :
                 ['done'].includes(to) ? pmId : devId,
      changedAt: new Date(time),
    });
    time = new Date(time.getTime() + randomBetween(2, 48) * 3600000);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Seed Analytics Data
// ---------------------------------------------------------------------------
async function seedAnalytics() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info('Connected to MongoDB for analytics seeding');

    // Fetch existing users and projects
    const users = await User.find({}).lean();
    const projects = await Project.find({ status: { $in: ['active', 'completed'] } }).lean();

    if (users.length < 4 || projects.length < 2) {
      logger.error('Not enough users/projects. Run the main seed first: node --loader ts-node/esm src/seeds/seed.js');
      process.exit(1);
    }

    const devs = users.filter(u => u.role === 'developer');
    const pms = users.filter(u => u.role === 'project_manager');
    const pm1 = pms[0];
    const pm2 = pms[1] || pms[0];

    logger.info(`Found ${devs.length} developers, ${pms.length} PMs, ${projects.length} projects`);

    // Step 1: Add stageHistory to existing tasks that have stages beyond 'backlog'
    logger.info('Backfilling stageHistory on existing tasks...');
    const existingTasks = await Task.find({
      $or: [
        { stageHistory: { $exists: false } },
        { stageHistory: { $size: 0 } },
        { stageHistory: null },
      ],
    });
    let backfilled = 0;

    for (const task of existingTasks) {
      if (task.stage === 'backlog') continue;

      const assigneeId = task.assignees?.[0] || devs[0]._id;
      const pmId = pm1._id;
      const created = task.createdAt;
      const transitions = [];

      const stageFlow = {
        todo: [['backlog', 'todo']],
        in_progress: [['backlog', 'todo'], ['todo', 'in_progress']],
        in_review: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review']],
        testing: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing']],
        done: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      };

      const flow = stageFlow[task.stage];
      if (!flow) continue;

      task.stageHistory = buildHistory(flow, created, assigneeId, pmId);
      await task.save();
      backfilled++;
    }
    logger.info(`  Backfilled ${backfilled} existing tasks`);

    // Step 2: Create new tasks with diverse analytics patterns
    logger.info('Creating analytics-rich tasks...');

    const proj = projects.find(p => p.status === 'active') || projects[0];

    // Define task scenarios with different performance patterns
    const scenarios = [
      // --- PRIYA (strong performer: mostly first-pass, fast) ---
      {
        title: 'Implement user authentication flow',
        type: 'feature', priority: 'critical', stage: 'done', assignees: [devs[0]._id],
        project: proj._id, dueDate: daysAgo(5), estimatedHours: 16, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(14),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'Build REST API for products endpoint',
        type: 'feature', priority: 'high', stage: 'done', assignees: [devs[0]._id],
        project: proj._id, dueDate: daysAgo(2), estimatedHours: 12, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(10),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Database schema optimization',
        type: 'improvement', priority: 'medium', stage: 'done', assignees: [devs[0]._id],
        project: proj._id, dueDate: daysAgo(1), estimatedHours: 8, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(7),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Implement caching layer',
        type: 'feature', priority: 'high', stage: 'done', assignees: [devs[0]._id],
        project: proj._id, dueDate: daysAgo(3), estimatedHours: 20, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(12),
        // One bounce then done
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'Setup CI/CD pipeline',
        type: 'deployment', priority: 'high', stage: 'in_review', assignees: [devs[0]._id],
        project: proj._id, dueDate: daysFromNow(3), estimatedHours: 10, progress: 80,
        createdBy: pm1._id, createdAt: daysAgo(5),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review']],
      },

      // --- ALEX (average performer: some bounces, moderate speed) ---
      {
        title: 'Design landing page',
        type: 'feature', priority: 'high', stage: 'done', assignees: [devs[1]._id],
        project: proj._id, dueDate: daysAgo(8), estimatedHours: 16, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(20),
        // Two bounces
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'Responsive mobile layout',
        type: 'feature', priority: 'medium', stage: 'done', assignees: [devs[1]._id],
        project: proj._id, dueDate: daysAgo(4), estimatedHours: 12, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(15),
        // Clean pass
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'User profile page',
        type: 'feature', priority: 'medium', stage: 'done', assignees: [devs[1]._id],
        project: proj._id, dueDate: daysAgo(6), estimatedHours: 10, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(18),
        // One bounce
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Dark mode toggle',
        type: 'improvement', priority: 'low', stage: 'in_progress', assignees: [devs[1]._id],
        project: proj._id, dueDate: daysFromNow(5), estimatedHours: 6, progress: 30,
        createdBy: pm1._id, createdAt: daysAgo(3),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress']],
      },
      {
        title: 'Notification dropdown component',
        type: 'feature', priority: 'medium', stage: 'done', assignees: [devs[1]._id],
        project: proj._id, dueDate: daysAgo(12), estimatedHours: 8, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(25),
        // Overdue completion - completed after due date
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },

      // --- EMILY (needs improvement: many bounces, slower) ---
      {
        title: 'Payment processing service',
        type: 'feature', priority: 'critical', stage: 'done', assignees: [devs[2]._id],
        project: proj._id, dueDate: daysAgo(2), estimatedHours: 32, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(25),
        // Three bounces
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'Webhook handler implementation',
        type: 'feature', priority: 'high', stage: 'done', assignees: [devs[2]._id],
        project: proj._id, dueDate: daysAgo(5), estimatedHours: 20, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(22),
        // Two bounces
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'Background job processor',
        type: 'feature', priority: 'medium', stage: 'in_review', assignees: [devs[2]._id],
        project: proj._id, dueDate: daysFromNow(2), estimatedHours: 24, progress: 75,
        createdBy: pm1._id, createdAt: daysAgo(14),
        // Already bounced once, back in review
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review']],
      },
      {
        title: 'Database migration scripts',
        type: 'feature', priority: 'high', stage: 'done', assignees: [devs[2]._id],
        project: proj._id, dueDate: daysAgo(10), estimatedHours: 14, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(20),
        // First pass (rare for Emily)
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'Error logging middleware',
        type: 'improvement', priority: 'medium', stage: 'done', assignees: [devs[2]._id],
        project: proj._id, dueDate: daysAgo(15), estimatedHours: 8, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(30),
        // Overdue + two bounces
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },

      // --- JAMES (good performer, few tasks) ---
      {
        title: 'Mobile push notification service',
        type: 'feature', priority: 'high', stage: 'done', assignees: [devs[3]._id],
        project: proj._id, dueDate: daysAgo(3), estimatedHours: 18, progress: 100,
        createdBy: pm2._id, createdAt: daysAgo(12),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
      {
        title: 'Deep linking setup',
        type: 'feature', priority: 'medium', stage: 'done', assignees: [devs[3]._id],
        project: proj._id, dueDate: daysAgo(7), estimatedHours: 10, progress: 100,
        createdBy: pm2._id, createdAt: daysAgo(16),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'App store deployment configuration',
        type: 'deployment', priority: 'high', stage: 'done', assignees: [devs[3]._id],
        project: proj._id, dueDate: daysAgo(1), estimatedHours: 6, progress: 100,
        createdBy: pm2._id, createdAt: daysAgo(8),
        // One bounce
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Offline mode data sync',
        type: 'feature', priority: 'critical', stage: 'in_progress', assignees: [devs[3]._id],
        project: proj._id, dueDate: daysFromNow(7), estimatedHours: 28, progress: 40,
        createdBy: pm2._id, createdAt: daysAgo(5),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress']],
      },

      // --- OLIVIA (QA, few tasks, clean record) ---
      {
        title: 'E2E test suite for checkout flow',
        type: 'research', priority: 'high', stage: 'done', assignees: [devs[4]._id],
        project: proj._id, dueDate: daysAgo(6), estimatedHours: 20, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(14),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Performance benchmark suite',
        type: 'research', priority: 'medium', stage: 'done', assignees: [devs[4]._id],
        project: proj._id, dueDate: daysAgo(3), estimatedHours: 14, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(10),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Security audit report',
        type: 'research', priority: 'critical', stage: 'in_review', assignees: [devs[4]._id],
        project: proj._id, dueDate: daysFromNow(2), estimatedHours: 16, progress: 85,
        createdBy: pm1._id, createdAt: daysAgo(6),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review']],
      },

      // --- BUG tasks (type: bug) with bounces ---
      {
        title: 'Fix login session timeout issue',
        type: 'bug', priority: 'critical', stage: 'done', assignees: [devs[0]._id],
        project: proj._id, dueDate: daysAgo(2), estimatedHours: 4, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(4),
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Fix broken pagination on product list',
        type: 'bug', priority: 'high', stage: 'done', assignees: [devs[1]._id],
        project: proj._id, dueDate: daysAgo(1), estimatedHours: 3, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(5),
        // Bounced once
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'done']],
      },
      {
        title: 'Fix memory leak in websocket handler',
        type: 'bug', priority: 'critical', stage: 'done', assignees: [devs[2]._id],
        project: proj._id, dueDate: daysAgo(3), estimatedHours: 8, progress: 100,
        createdBy: pm1._id, createdAt: daysAgo(10),
        // Three bounces
        pattern: [['backlog', 'todo'], ['todo', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'in_progress'], ['in_progress', 'in_review'], ['in_review', 'testing'], ['testing', 'done']],
      },
    ];

    let created = 0;
    for (const scenario of scenarios) {
      const { pattern, createdAt, ...taskData } = scenario;
      const task = new Task(taskData);

      // Set createdAt manually
      task.createdAt = createdAt;

      // Build stageHistory with realistic timestamps
      const assigneeId = task.assignees[0];
      task.stageHistory = buildHistory(pattern, createdAt, assigneeId, pm1._id);

      // For overdue tasks: adjust the done timestamp to be after dueDate
      if (task.title === 'Notification dropdown component' && task.dueDate) {
        const doneEntry = task.stageHistory.find(e => e.to === 'done');
        if (doneEntry) doneEntry.changedAt = new Date(task.dueDate.getTime() + 3 * 86400000);
      }
      if (task.title === 'Error logging middleware' && task.dueDate) {
        const doneEntry = task.stageHistory.find(e => e.to === 'done');
        if (doneEntry) doneEntry.changedAt = new Date(task.dueDate.getTime() + 5 * 86400000);
      }

      await task.save();
      created++;
    }

    logger.info(`  Created ${created} analytics tasks`);

    // Summary
    const totalTasks = await Task.countDocuments({});
    const withHistory = await Task.countDocuments({ 'stageHistory.0': { $exists: true } });
    logger.info(`\nDone! Total tasks: ${totalTasks}, Tasks with stageHistory: ${withHistory}`);
    logger.info('\nExpected analytics patterns:');
    logger.info('  Priya  — 4 completed, ~75% first-pass, 1 bounce, fast completion');
    logger.info('  Alex   — 4 completed, ~25% first-pass, 4 bounces, 1 overdue');
    logger.info('  Emily  — 4 completed, ~25% first-pass, 8 bounces, 1 overdue, slower');
    logger.info('  James  — 3 completed, ~66% first-pass, 1 bounce');
    logger.info('  Olivia — 2 completed, 100% first-pass, 0 bounces, clean record');

    process.exit(0);
  } catch (err) {
    logger.error('Analytics seed failed:', err);
    process.exit(1);
  }
}

seedAnalytics();
