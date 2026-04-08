import cron from 'node-cron';
import mongoose from 'mongoose';
import { logger } from '../config/index.js';
import targetService, { currentPeriodKey } from '../modules/targets/target.service.js';

export function startTargetAlert() {
  // Run every Monday at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Running target alert job...');
    try {
      const Target = mongoose.model('Target');
      const User = mongoose.model('User');
      const NotificationService = (await import('../modules/notifications/notification.service.js')).default;

      const monthKey = currentPeriodKey('month');
      const quarterKey = currentPeriodKey('quarter');

      const targets = await Target.find({
        $or: [
          { period: 'month', periodKey: monthKey },
          { period: 'quarter', periodKey: quarterKey },
        ],
      }).populate('user', 'name email');

      const admins = await User.find({ role: 'super_admin' }).select('_id');

      for (const target of targets) {
        const progress = await targetService.getProgress(target);
        const daysLeft = Math.ceil((new Date(target.period === 'month'
          ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          : new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 1)
        ).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // Behind target: revenue <70% with <10 days left
        if (progress.revenuePct < 70 && daysLeft < 10 && target.revenueTarget > 0) {
          const label = target.type === 'firm'
            ? `Firm ${target.period}`
            : `${target.user?.name || 'User'} ${target.period}`;
          for (const admin of admins) {
            await NotificationService.create({
              user: admin._id,
              type: 'target_behind',
              title: 'Target Behind Pace',
              message: `${label} target at ${progress.revenuePct}% with ${daysLeft} days left`,
              entityType: 'Target',
              entityId: target._id,
              link: '/targets',
            });
          }
        }
      }

      logger.info(`Target alert job: checked ${targets.length} targets`);
    } catch (error) {
      logger.error(`Target alert job failed: ${error.message}`);
    }
  });

  logger.info('Target alert cron job scheduled (Mondays at 9:00 AM)');
}
