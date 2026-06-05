import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const auditLogSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // ref User
  userName: { type: String, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true }, // e.g. LOGIN, LOGOUT, CREATE_ACTIVITY, APPROVE, REJECT, MONTHLY_CLOSURE, UPDATE_EVIDENCE
  ipAddress: { type: String },
  details: { type: String },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed }
  }
}, { timestamps: true });

export const AuditLog = process.env.USE_MOCK_DB === 'true' 
  ? getModel('AuditLog') 
  : mongoose.model('AuditLog', auditLogSchema);
