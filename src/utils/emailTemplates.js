import { env } from '../config/index.js';

const baseUrl = env.clientUrl;

function layout(content) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #3b82f6; padding: 20px 24px;">
        <h1 style="color: #fff; font-size: 18px; margin: 0; font-weight: 600;">PMS</h1>
      </div>
      <div style="padding: 24px;">
        ${content}
      </div>
      <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated notification from PMS. <a href="${baseUrl}" style="color: #3b82f6; text-decoration: none;">Open PMS</a></p>
      </div>
    </div>
  `;
}

function actionButton(text, link) {
  return `<a href="${baseUrl}${link}" style="display: inline-block; padding: 10px 24px; background: #3b82f6; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">${text}</a>`;
}

export const emailTemplates = {
  task_assigned({ actorName, taskTitle, taskId, link }) {
    return {
      subject: `[PMS] You were assigned to: ${taskTitle}`,
      html: layout(`
        <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Task Assignment</h2>
        <p style="color: #475569; margin: 0 0 8px;"><strong>${actorName}</strong> assigned you to task <strong>${taskId}</strong>:</p>
        <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 16px;">${taskTitle}</p>
        ${actionButton('View Task', link || '/tasks')}
      `),
    };
  },

  bug_assigned({ actorName, bugTitle, bugId, link }) {
    return {
      subject: `[PMS] Bug assigned to you: ${bugTitle}`,
      html: layout(`
        <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Bug Assignment</h2>
        <p style="color: #475569; margin: 0 0 8px;"><strong>${actorName}</strong> assigned you to bug <strong>${bugId}</strong>:</p>
        <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 16px;">${bugTitle}</p>
        ${actionButton('View Bug', link || '/bugs')}
      `),
    };
  },

  comment_mention({ actorName, body, entityTitle, link }) {
    return {
      subject: `[PMS] ${actorName} mentioned you in a comment`,
      html: layout(`
        <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">You were mentioned</h2>
        <p style="color: #475569; margin: 0 0 8px;"><strong>${actorName}</strong> mentioned you in <strong>${entityTitle}</strong>:</p>
        <div style="background: #f8fafc; border-left: 3px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 12px 0;">
          <p style="color: #475569; margin: 0; font-size: 14px;">${body?.substring(0, 200)}${body?.length > 200 ? '...' : ''}</p>
        </div>
        ${actionButton('View Comment', link || '/dashboard')}
      `),
    };
  },

  deadline_approaching({ taskTitle, taskId, dueDate, link }) {
    return {
      subject: `[PMS] Deadline approaching: ${taskTitle}`,
      html: layout(`
        <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Deadline Reminder</h2>
        <p style="color: #475569; margin: 0 0 8px;">Task <strong>${taskId}</strong> is due soon:</p>
        <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 4px;">${taskTitle}</p>
        <p style="color: #ef4444; font-size: 14px; margin: 0 0 16px;">Due: ${new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        ${actionButton('View Task', link || '/tasks')}
      `),
    };
  },

  status_change({ actorName, entityTitle, entityType, oldStatus, newStatus, link }) {
    return {
      subject: `[PMS] ${entityType} updated: ${entityTitle}`,
      html: layout(`
        <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Status Update</h2>
        <p style="color: #475569; margin: 0 0 8px;"><strong>${actorName}</strong> updated ${entityType.toLowerCase()} <strong>${entityTitle}</strong>:</p>
        <p style="color: #475569; margin: 0 0 16px;">
          <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 13px;">${oldStatus}</span>
          &rarr;
          <span style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-size: 13px; color: #1d4ed8;">${newStatus}</span>
        </p>
        ${actionButton('View Details', link || '/dashboard')}
      `),
    };
  },
};
