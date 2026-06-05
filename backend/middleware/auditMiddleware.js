import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async (req, action, details, before = null, after = null) => {
  try {
    const userId = req.user ? String(req.user._id) : 'SYSTEM';
    const userName = req.user ? req.user.name : 'System Scheduler';
    const role = req.user ? req.user.role : 'System';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    await AuditLog.create({
      userId,
      userName,
      role,
      action,
      ipAddress,
      details,
      changes: {
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
