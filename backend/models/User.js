import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Faculty', 'Student', 'HOD', 'IQAC', 'Principal', 'Admin'], 
    required: true 
  },
  department: { type: String, required: true },
  designation: { type: String },
  studentId: { type: String },
  facultyId: { type: String },
  academicYear: { type: String, required: true },
  active: { type: Boolean, default: true },
  apiScore: { type: Number, default: 0 },
  profilePhoto: { type: String },
  monthlyClosureStatus: [{
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    closed: { type: Boolean, default: false },
    closedAt: { type: Date }
  }]
}, { timestamps: true });

export const User = process.env.USE_MOCK_DB === 'true' 
  ? getModel('User') 
  : mongoose.model('User', userSchema);
