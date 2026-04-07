import cron from 'node-cron';
import mongoose from 'mongoose';
import { logger } from '../config/index.js';

export function startFollowUpReminder() {
  // Run daily at 9:30 AM
  cron.schedule('30 9 * * *', async () => {
    logger.info('Running follow-up reminder job...');
    try {
      const Activity = mongoose.model('Activity');
      const Lead = mongoose.model('Lead');
      const NotificationService = (await import('../modules/notifications/notification.service.js')).default;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const now = new Date();

      // Find activities with nextActionDate today
      const dueToday = await Activity.find({
        nextActionDate: { $gte: todayStart, $lte: todayEnd },
      })
        .populate('lead', 'leadId contactName')
        .populate('createdBy', 'name email');

      for (const activity of dueToday) {
        if (!activity.createdBy || !activity.lead) continue;
        await NotificationService.create({
          user: activity.createdBy._id,
          type: 'followup_due',
          title: 'Follow-up Due Today',
          message: `${activity.lead.contactName} (${activity.lead.leadId}) — ${activity.nextAction || 'Follow up scheduled'}`,
          entityType: 'Lead',
          entityId: activity.lead._id,
          link: '/leads',
        });
      }

      // Find activities overdue (nextActionDate in past)
      const overdue = await Activity.find({
        nextActionDate: { $lt: todayStart, $ne: null },
      })
        .populate('lead', 'leadId contactName')
        .populate('createdBy', 'name email');

      for (const activity of overdue) {
        if (!activity.createdBy || !activity.lead) continue;
        // Check if there's a newer activity on the same lead (already followed up)
        const newer = await Activity.findOne({
          lead: activity.lead._id,
          createdAt: { $gt: activity.createdAt },
        });
        if (newer) continue;

        await NotificationService.create({
          user: activity.createdBy._id,
          type: 'followup_overdue',
          title: 'Overdue Follow-up',
          message: `${activity.lead.contactName} (${activity.lead.leadId}) — overdue follow-up`,
          entityType: 'Lead',
          entityId: activity.lead._id,
          link: '/leads',
        });
      }

      logger.info(`Follow-up reminder: ${dueToday.length} due today, ${overdue.length} overdue checked`);
    } catch (error) {
      logger.error(`Follow-up reminder job failed: ${error.message}`);
    }
  });

  logger.info('Follow-up reminder cron job scheduled (daily at 9:30 AM)');
}
