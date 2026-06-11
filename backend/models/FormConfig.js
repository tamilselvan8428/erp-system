import mongoose from 'mongoose';
import { getModel } from '../utils/mockDb.js';

const formConfigSchema = new mongoose.Schema({
  formName: { type: String, required: true, unique: true }, // e.g. "FacultyActivity"
  categories: [{ type: String }],
  proofMethods: [{ type: String }],
  fields: [{
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'select'], required: true },
    options: [{ type: String }],
    required: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export const FormConfig = process.env.USE_MOCK_DB === 'true'
  ? getModel('FormConfig')
  : mongoose.model('FormConfig', formConfigSchema);
