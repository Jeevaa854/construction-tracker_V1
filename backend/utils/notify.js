import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendEmail from './sendEmail.js';

/**
 * Creates an in-app notification for a recipient, and additionally
 * emails them if their notification preferences allow it for this type.
 * Never throws — a notification failure should not break the calling action.
 */
const notify = async ({ recipientId, type, title, message, relatedProject, relatedTask }) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedProject,
      relatedTask,
    });

    const user = await User.findById(recipientId);
    if (!user || !user.notificationPreferences?.email) return;

    const alertTypeAllowed =
      (type === 'task-deadline' && user.notificationPreferences.deadlineAlerts) ||
      (type === 'budget-alert' && user.notificationPreferences.budgetAlerts) ||
      ['task-assigned', 'task-completed', 'project-update', 'general', 'resource-alert'].includes(
        type
      );

    if (!alertTypeAllowed) return;

    await sendEmail({
      to: user.email,
      subject: title,
      html: `<div style="font-family:Arial,sans-serif;"><p>Hi ${user.name},</p><p>${message}</p></div>`,
    });
  } catch (error) {
    console.error(`Failed to send notification: ${error.message}`);
  }
};

export default notify;
