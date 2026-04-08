import app from './app.js';
import { env, connectDB, logger } from './config/index.js';
import { startDeadlineReminder } from './jobs/deadline-reminder.js';
import { startFollowUpReminder } from './jobs/followup-reminder.js';
import { startTargetAlert } from './jobs/target-alert.js';

const start = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  // Start cron jobs
  startDeadlineReminder();
  startFollowUpReminder();
  startTargetAlert();

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    shutdown('UNHANDLED_REJECTION');
  });
};

start();
