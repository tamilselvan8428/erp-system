import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }
}, { timestamps: true });

export const Department = process.env.USE_MOCK_DB === 'true' 
  ? getModel('Department') 
  : mongoose.model('Department', departmentSchema);
