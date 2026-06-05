import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const studentAchievementSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, // ref User
  studentName: { type: String, required: true },
  department: { type: String, required: true },
  academicYear: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'Internship', 'Placement Offer', 'Higher Studies', 
      'NPTEL Certification', 'Publication', 'Patent', 
      'Startup', 'Hackathon', 'Award', 'Competition'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  organization: { type: String, required: true }, // Company name, university, NPTEL, competition organizer
  details: { type: String }, // e.g. CTC package, NPTEL Gold/Elite, Higher studies course, reward money
  dateOccurred: { type: Date, required: true },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    version: { type: Number, default: 1 },
    uploadedAt: { type: Date, default: Date.now }
  }],
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

export const StudentAchievement = process.env.USE_MOCK_DB === 'true' 
  ? getModel('StudentAchievement') 
  : mongoose.model('StudentAchievement', studentAchievementSchema);
