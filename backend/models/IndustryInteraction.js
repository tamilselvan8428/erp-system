import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const industryInteractionSchema = new mongoose.Schema({
  coordinatorId: { type: String, required: true }, // ref User
  coordinatorName: { type: String, required: true },
  department: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['MoU', 'Industry Visit', 'Expert Talk', 'Consultancy Interaction'], 
    required: true 
  },
  organizationName: { type: String, required: true },
  contactPerson: { type: String },
  contactEmail: { type: String },
  dateOccurred: { type: Date, required: true }, // Start date of MoU, or date of visit/talk
  validityEndDate: { type: Date }, // End date for MoUs
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Active', 'Expired', 'Pending'], 
    default: 'Active' 
  },
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

export const IndustryInteraction = process.env.USE_MOCK_DB === 'true' 
  ? getModel('IndustryInteraction') 
  : mongoose.model('IndustryInteraction', industryInteractionSchema);
