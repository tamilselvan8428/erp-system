import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Department } from '../models/Department.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

const router = express.Router();

// =========================================================================
// USER MANAGEMENT SECTION (Authorized for Admin and Principal)
// =========================================================================

// @desc    Get all users
// @route   GET /api/admin/users
router.get('/users', protect, authorize('Admin', 'Principal'), async (req, res) => {
  try {
    const list = await User.find({}).sort({ role: 1, name: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user list', error: err.message });
  }
});

// @desc    Create a new user
// @route   POST /api/admin/users
router.post('/users', protect, authorize('Admin', 'Principal'), async (req, res) => {
  const { name, email, password, role, department, designation, studentId, facultyId, academicYear } = req.body;

  if (!name || !email || !password || !role || !department || !academicYear) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      designation,
      studentId: role === 'Student' ? studentId : undefined,
      facultyId: role !== 'Student' ? facultyId : undefined,
      academicYear,
      active: true,
      apiScore: 0,
      monthlyClosureStatus: []
    });

    await logAudit(req, 'CREATE_USER', `Created new user account: ${email} (${role})`, null, newUser);

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      designation: newUser.designation
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating user account', error: err.message });
  }
});

// @desc    Update user details
// @route   PUT /api/admin/users/:id
router.put('/users/:id', protect, authorize('Admin', 'Principal'), async (req, res) => {
  const { id } = req.params;
  const { name, email, role, department, designation, active, apiScore } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const before = { ...user };
    const updateObj = { name, email, role, department, designation, active, apiScore };
    
    // Hash password if updating
    if (req.body.password && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateObj.password = await bcrypt.hash(req.body.password, salt);
    }

    const updated = await User.findByIdAndUpdate(id, updateObj, { new: true });
    await logAudit(req, 'UPDATE_USER', `Modified details for user ${email}`, before, updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', protect, authorize('Admin', 'Principal'), async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndDelete(id);
    await logAudit(req, 'DELETE_USER', `Deleted user account: ${user.email}`, user, null);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

// =========================================================================
// DEPARTMENT MANAGEMENT SECTION
// =========================================================================

// @desc    Get all departments (authenticated)
// @route   GET /api/admin/departments
router.get('/departments', protect, async (req, res) => {
  try {
    const list = await Department.find({}).sort({ code: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching departments', error: err.message });
  }
});

// @desc    Create new department (Admin/Principal only)
// @route   POST /api/admin/departments
router.post('/departments', protect, authorize('Admin', 'Principal'), async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ message: 'Please provide both name and code' });
  }
  try {
    const exists = await Department.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: 'Department already exists with this code' });
    }
    const newDept = await Department.create({ name, code: code.toUpperCase() });
    await logAudit(req, 'CREATE_DEPARTMENT', `Created department: ${code.toUpperCase()}`, null, newDept);
    res.status(201).json(newDept);
  } catch (err) {
    res.status(500).json({ message: 'Error creating department', error: err.message });
  }
});

// @desc    Delete department (Admin/Principal only)
// @route   DELETE /api/admin/departments/:id
router.delete('/departments/:id', protect, authorize('Admin', 'Principal'), async (req, res) => {
  const { id } = req.params;
  try {
    const dept = await Department.findById(id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    await Department.findByIdAndDelete(id);
    await logAudit(req, 'DELETE_DEPARTMENT', `Deleted department: ${dept.code}`, dept, null);
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting department', error: err.message });
  }
});

// =========================================================================
// SYSTEM AUDIT LOGS SECTION
// =========================================================================

// @desc    Get all system audit logs
// @route   GET /api/admin/audit-logs
router.get('/audit-logs', protect, authorize('Admin', 'Principal'), async (req, res) => {
  const { action, userId } = req.query;
  const query = {};
  if (action) query.action = action;
  if (userId) query.userId = userId;

  try {
    const list = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audit logs', error: err.message });
  }
});

export default router;

