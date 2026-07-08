import ActivityLog from '../models/ActivityLog.js';

/**
 * Records an audit-trail entry. Failures here are logged but never
 * thrown, so a logging problem can't break the actual request.
 */
const logActivity = async ({ userId, action, entityType, entityId, metadata = {} }) => {
  try {
    await ActivityLog.create({ user: userId, action, entityType, entityId, metadata });
  } catch (error) {
    console.error(`Failed to write activity log: ${error.message}`);
  }
};

export default logActivity;
