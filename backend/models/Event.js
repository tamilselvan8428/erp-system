import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const eventSchema = new mongoose.Schema({
  organizerId: { type: String, required: true }, // ref User
  organizerName: { type: String, required: true },
  department: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Guest Lecture', 'Workshop', 'Symposium', 'Conference', 'Hackathon', 'Project Expo', 'Special Day'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  venue: { type: String, required: true },
  internalExternal: { type: String, enum: ['Internal', 'External'], required: true },
  targetedAudience: { type: String },
  participantsCount: { type: Number, default: 0 },
  budgetSanctioned: { type: Number, default: 0 },
  budgetSpent: { type: Number, default: 0 },
  attachments: [{
    name: { type: String, required: true }, // e.g. Brochure, Circular, Attendance, Report
    url: { type: String, required: true },
    version: { type: Number, default: 1 },
    uploadedAt: { type: Date, default: Date.now }
  }],
  photos: [{ type: String }], // URLs of photos uploaded
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'HOD_Approved', 'IQAC_Approved', 'Rejected'], 
    default: 'Pending' 
  },
  verifiedBy: { type: String },
  rejectionReason: { type: String },
  accreditationMapping: {
    naac: [String],
    nba: [String]
  }
}, { timestamps: true });

export const Event = process.env.USE_MOCK_DB === 'true' 
  ? getModel('Event') 
  : mongoose.model('Event', eventSchema);
