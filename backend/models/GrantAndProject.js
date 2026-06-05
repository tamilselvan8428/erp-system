import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const grantAndProjectSchema = new mongoose.Schema({
  investigatorId: { type: String, required: true }, // ref User
  investigatorName: { type: String, required: true },
  department: { type: String, required: true },
  title: { type: String, required: true },
  fundingAgency: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Research Grant', 'Consultancy', 'Seed Money'], 
    required: true 
  },
  amountSanctioned: { type: Number, required: true }, // in INR
  durationYears: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Applied', 'Ongoing', 'Completed'], 
    required: true 
  },
  projectOutcome: { type: String },
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
    nba: [String],
    nirf: [String]
  }
}, { timestamps: true });

export const GrantAndProject = process.env.USE_MOCK_DB === 'true' 
  ? getModel('GrantAndProject') 
  : mongoose.model('GrantAndProject', grantAndProjectSchema);
