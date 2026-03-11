import notificationService from '../modules/notifications/notification.service.js';

export async function notify({ userId, type, title, message, entityType, entityId, link, actor }) {
  try {
    await notificationService.create({ user: userId, type, title, message, entityType, entityId, link, actor });
  } catch {
    // Don't let notification failures break the main flow
  }
}

export async function notifyMany(users, data) {
  try {
    const notifications = users.map((userId) => ({ user: userId, ...data }));
    await notificationService.createBulk(notifications);
  } catch {
    // Silent fail
  }
}
