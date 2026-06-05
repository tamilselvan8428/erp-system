import express from 'express';
import { StudentAchievement } from '../models/StudentAchievement.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { mapActivityToAccreditation } from '../utils/accreditationMapper.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const { studentId, department, status, type } = req.query;
  const query = {};

  if (status) query.verificationStatus = status;
  if (type) query.type = type;

  if (req.user.role === 'Student') {
    query.studentId = String(req.user._id);
  } else if (req.user.role === 'Faculty' || req.user.role === 'HOD') {
    query.department = req.user.department;
    if (studentId) query.studentId = studentId;
  } else {
    if (department) query.department = department;
    if (studentId) query.studentId = studentId;
  }

  try {
    const list = await StudentAchievement.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving student achievements', error: err.message });
  }
});

router.post('/', protect, authorize('Student', 'Faculty', 'Admin'), async (req, res) => {
  const { type, title, organization, details, dateOccurred, attachments } = req.body;

  try {
    const studentId = req.user.role === 'Student' ? String(req.user._id) : (req.body.studentId || String(req.user._id));
    const user = await User.findById(studentId);
    const mapping = mapActivityToAccreditation('StudentAchievement', type);

    const record = await StudentAchievement.create({
      studentId,
      studentName: user.name,
      department: user.department,
      academicYear: user.academicYear,
      type,
      title,
      organization,
      details,
      dateOccurred,
      attachments: attachments || [],
      accreditationMapping: mapping,
      verificationStatus: 'Pending'
    });

    // Notify HOD and Faculty advisors in same department
    const decs = await User.find({ 
      role: { $in: ['HOD', 'Faculty'] }, 
      department: user.department 
    });
    for (const dec of decs) {
      await Notification.create({
        recipientId: String(dec._id),
        senderId: studentId,
        senderName: user.name,
        title: 'Student Achievement for Approval',
        message: `${user.name} logged an achievement: "${title}" (${type}). Verification requested.`,
        type: 'ApprovalRequest',
        link: '/student-achievements'
      });
    }

    await logAudit(req, 'CREATE_STUDENT_ACHIEVEMENT', `Student logged ${type}: "${title}"`, null, record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Error logging achievement', error: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const record = await StudentAchievement.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (req.user.role === 'Student' && record.studentId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized modification' });
    }

    if (req.user.role === 'Student') req.body.verificationStatus = 'Pending';
    const updated = await StudentAchievement.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await logAudit(req, 'UPDATE_STUDENT_ACHIEVEMENT', `Updated student achievement ${record.title}`, record, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating record', error: err.message });
  }
});

router.post('/:id/verify', protect, authorize('Faculty', 'HOD', 'IQAC', 'Admin'), async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const record = await StudentAchievement.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    // HOD/Faculty can approve or reject
    const before = { ...record };
    record.verificationStatus = status;
    record.verifiedBy = String(req.user._id);
    if (status === 'Rejected') record.rejectionReason = rejectionReason;

    await record.save();

    await Notification.create({
      recipientId: record.studentId,
      senderId: String(req.user._id),
      senderName: req.user.name,
      title: `Achievement ${status === 'Rejected' ? 'Rejected' : 'Approved'}`,
      message: `Your achievement "${record.title}" was ${status === 'Rejected' ? 'rejected' : 'verified'} by ${req.user.role} ${req.user.name}.`,
      type: 'VerificationUpdate',
      link: '/student-achievements'
    });

    await logAudit(req, 'VERIFY_STUDENT_ACHIEVEMENT', `Verified student achievement to ${status}`, before, record);
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'Error verifying achievement', error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await StudentAchievement.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (req.user.role === 'Student' && record.studentId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await StudentAchievement.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE_STUDENT_ACHIEVEMENT', `Deleted student achievement "${record.title}"`, record, null);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting record', error: err.message });
  }
});

export default router;
