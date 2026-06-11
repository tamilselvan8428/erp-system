import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fsais_secret_key_123';

// Helper to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    User Login
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);

    // Write login event to Audit Trail
    const reqMock = { user, ip: req.ip, headers: req.headers };
    await logAudit(reqMock, 'LOGIN', `User ${user.email} successfully logged in`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        studentId: user.studentId,
        facultyId: user.facultyId,
        academicYear: user.academicYear,
        apiScore: user.apiScore,
        monthlyClosureStatus: user.monthlyClosureStatus
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server login error', error: err.message });
  }
});

// @desc    Get Current User
// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    department: req.user.department,
    designation: req.user.designation,
    studentId: req.user.studentId,
    facultyId: req.user.facultyId,
    academicYear: req.user.academicYear,
    apiScore: req.user.apiScore,
    monthlyClosureStatus: req.user.monthlyClosureStatus
  });
});

// @desc    Change Password
// @route   PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide old and new passwords' });
  }

  try {
    // Find the user (using User model from DB/Mock)
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    
    await User.findByIdAndUpdate(req.user._id, { password: hashed });
    await logAudit(req, 'CHANGE_PASSWORD', `User ${user.email} updated password`);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating password', error: err.message });
  }
});

// @desc    Forgot Password Mock Link
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account with that email' });
    }
    // Simulate email dispatch
    console.log(`[MAIL MOCK] Password reset link sent to ${email}`);
    res.json({ message: 'Password reset link sent to registered email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @desc    Get Notifications for Logged in User
// @route   GET /api/auth/notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const list = await Notification.find({ recipientId: { $in: [String(req.user._id), req.user._id] } }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving notifications', error: err.message });
  }
});

// @desc    Mark Notification as Read
// @route   PUT /api/auth/notifications/:id/read
router.put('/notifications/:id/read', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    // Verify recipient matches logged in user
    if (String(notif.recipientId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to read this notification' });
    }
    
    notif.readStatus = true;
    await notif.save();
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Error marking notification read', error: err.message });
  }
});

// @desc    Clear / Delete all notifications for user
// @route   DELETE /api/auth/notifications
router.delete('/notifications', protect, async (req, res) => {
  try {
    if (process.env.USE_MOCK_DB === 'true') {
      const list = await Notification.find({ recipientId: { $in: [String(req.user._id), req.user._id] } });
      for (const item of list) {
        await Notification.findByIdAndDelete(item._id);
      }
    } else {
      await Notification.deleteMany({ recipientId: { $in: [String(req.user._id), req.user._id] } });
    }
    res.json({ message: 'Notifications cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing notifications', error: err.message });
  }
});

export default router;
