import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const notificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true }, // ref User
  senderId: { type: String }, // ref User (system if null)
  senderName: { type: String, default: 'System' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['ApprovalRequest', 'Reminder', 'ActivityLogged', 'MonthlyClosureAlert', 'VerificationUpdate'], 
    default: 'ActivityLogged' 
  },
  readStatus: { type: Boolean, default: false },
  link: { type: String }, // URL redirect or route in frontend
}, { timestamps: true });

export const Notification = process.env.USE_MOCK_DB === 'true' 
  ? getModel('Notification') 
  : mongoose.model('Notification', notificationSchema);
