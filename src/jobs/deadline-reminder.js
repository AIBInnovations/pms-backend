import cron from 'node-cron';
import mongoose from 'mongoose';
import { logger } from '../config/index.js';
import { emailTemplates } from '../utils/emailTemplates.js';
import { sendNotificationEmail } from '../utils/email.js';

export function startDeadlineReminder() {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running deadline reminder job...');
    try {
      const Task = mongoose.model('Task');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find tasks due within the next 24 hours that aren't done
      const tasks = await Task.find({
        dueDate: { $gte: today, $lte: tomorrow },
        stage: { $nin: ['done', 'archived'] },
      })
        .populate('assignees', 'name email')
        .populate('project', 'code');

      let notified = 0;
      const NotificationService = (await import('../modules/notifications/notification.service.js')).default;
      const PreferenceService = (await import('../modules/notifications/preference.service.js')).default;

      for (const task of tasks) {
        for (const assignee of task.assignees) {
          // Create in-app notification
          const shouldInApp = await PreferenceService.shouldNotify(assignee._id, 'deadline_approaching', 'inApp');
          if (shouldInApp) {
            await NotificationService.create({
              user: assignee._id,
              type: 'deadline_approaching',
              title: 'Deadline Approaching',
              message: `Task "${task.title}" is due ${task.dueDate.toLocaleDateString()}`,
              entityType: 'Task',
              entityId: task._id,
              link: '/tasks',
            });
          }

          // Send email notification
          const shouldEmail = await PreferenceService.shouldNotify(assignee._id, 'deadline_approaching', 'email');
          if (shouldEmail && assignee.email) {
            const template = emailTemplates.deadline_approaching({
              taskTitle: task.title,
              taskId: task.taskId,
              dueDate: task.dueDate,
              link: '/tasks',
            });
            await sendNotificationEmail(assignee.email, template.subject, template.html);
          }

          notified++;
        }
      }

      logger.info(`Deadline reminder: notified ${notified} assignees for ${tasks.length} tasks`);
    } catch (error) {
      logger.error(`Deadline reminder job failed: ${error.message}`);
    }
  });

  logger.info('Deadline reminder cron job scheduled (daily at 9:00 AM)');
}
