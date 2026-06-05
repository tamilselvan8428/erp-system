import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const patentSchema = new mongoose.Schema({
  inventorId: { type: String, required: true }, // ref User
  inventorName: { type: String, required: true },
  department: { type: String, required: true },
  title: { type: String, required: true },
  applicationNumber: { type: String, required: true },
  filingDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Filed', 'Published', 'Granted'], 
    required: true 
  },
  patentNumber: { type: String }, // optional, unless status is Granted
  grantDate: { type: Date },
  country: { type: String, default: 'India' },
  coInventors: [{ type: String }],
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
    nirf: [String],
    ariia: [String]
  }
}, { timestamps: true });

export const Patent = process.env.USE_MOCK_DB === 'true' 
  ? getModel('Patent') 
  : mongoose.model('Patent', patentSchema);
