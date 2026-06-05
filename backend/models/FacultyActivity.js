import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const facultyActivitySchema = new mongoose.Schema({
  facultyId: { type: String, required: true }, // ref User
  facultyName: { type: String, required: true },
  department: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['FDP', 'STTP', 'Workshop', 'Online Course', 'Resource Person'], 
    required: true 
  },
  title: { type: String, required: true },
  organizer: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: Number, required: true }, // in days
  role: { type: String, enum: ['Participant', 'Coordinator', 'Resource Person'], required: true },
  participantsCount: { type: Number, default: 0 },
  attachments: [{
    name: { type: String, required: true },
    type: { type: String }, // e.g. Certificate, Brochure, Attendance, Report
    url: { type: String, required: true },
    version: { type: Number, default: 1 },
    uploadedAt: { type: Date, default: Date.now }
  }],
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'HOD_Approved', 'IQAC_Approved', 'Rejected'], 
    default: 'Pending' 
  },
  verifiedBy: { type: String }, // User ID
  rejectionReason: { type: String },
  accreditationMapping: {
    naac: [String],
    nba: [String],
    nirf: [String],
    aicte: [String],
    ariia: [String]
  }
}, { timestamps: true });

export const FacultyActivity = process.env.USE_MOCK_DB === 'true' 
  ? getModel('FacultyActivity') 
  : mongoose.model('FacultyActivity', facultyActivitySchema);
