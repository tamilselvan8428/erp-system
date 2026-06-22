import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const publicationSchema = new mongoose.Schema({
  authorId: { type: String, required: true }, // ref User
  authorName: { type: String, required: true },
  department: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Journal', 'Conference', 'Book', 'Book Chapter'], 
    required: true 
  },
  title: { type: String, required: true },
  journalConferenceName: { type: String, required: true },
  issnIsbn: { type: String },
  publisher: { type: String },
  publicationDate: { type: Date, required: true },
  volume: { type: String },
  issue: { type: String },
  pages: { type: String },
  doi: { type: String },
  impactFactor: { type: Number, default: 0 },
  citationCount: { type: Number, default: 0 },
  indexing: [{ type: String }], // e.g. Scopus, Web of Science, Google Scholar
  coAuthors: [{ type: String }],
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
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  accreditationMapping: {
    naac: [String],
    nba: [String],
    nirf: [String]
  }
}, { timestamps: true });

export const Publication = process.env.USE_MOCK_DB === 'true' 
  ? getModel('Publication') 
  : mongoose.model('Publication', publicationSchema);
