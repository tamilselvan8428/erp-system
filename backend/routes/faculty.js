import express from 'express';
import { FacultyActivity } from '../models/FacultyActivity.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { mapActivityToAccreditation } from '../utils/accreditationMapper.js';
import { calculateAndSaveApiScore } from '../utils/apiScoreGenerator.js';

const router = express.Router();

// @desc    Get all activities (filtered by role/permissions)
// @route   GET /api/faculty
router.get('/', protect, async (req, res) => {
  const { facultyId, status, department, type, academicYear } = req.query;
  const query = {};

  // Filters
  if (type) query.type = type;
  if (status) query.verificationStatus = status;
  if (academicYear) query.academicYear = academicYear;

  // Role based scoping
  if (req.user.role === 'Faculty') {
    query.department = req.user.department;
  } else if (req.user.role === 'Student') {
    return res.status(403).json({ message: 'Students cannot access faculty records' });
  } else if (req.user.role === 'HOD') {
    query.department = req.user.department;
    if (facultyId) query.facultyId = facultyId;
  } else {
    // IQAC, Principal, Admin can view all, filter by department
    if (department) query.department = department;
    if (facultyId) query.facultyId = facultyId;
  }

  try {
    const list = await FacultyActivity.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving activities', error: err.message });
  }
});

// @desc    Create new activity
// @route   POST /api/faculty
router.post('/', protect, authorize('Faculty', 'HOD', 'Admin'), async (req, res) => {
  const { type, title, organizer, startDate, endDate, duration, role, participantsCount, attachments, customFields } = req.body;

  try {
    // Auto-map accreditation fields
    const accreditationMapping = mapActivityToAccreditation('FacultyActivity', type);

    const facultyId = req.user.role === 'Faculty' ? String(req.user._id) : (req.body.facultyId || String(req.user._id));
    const facultyUser = await User.findById(facultyId);

    const activity = await FacultyActivity.create({
      facultyId,
      facultyName: facultyUser.name,
      department: facultyUser.department,
      type,
      title,
      organizer,
      startDate,
      endDate,
      duration,
      role,
      participantsCount: participantsCount || 0,
      attachments: attachments || [],
      customFields: customFields || {},
      accreditationMapping,
      verificationStatus: 'Pending'
    });

    // Create Notification for HOD
    const hods = await User.find({ role: 'HOD', department: facultyUser.department });
    for (const hod of hods) {
      await Notification.create({
        recipientId: String(hod._id),
        senderId: String(req.user._id),
        senderName: req.user.name,
        title: 'New Approval Request',
        message: `${facultyUser.name} submitted a new ${type} activity: "${title}" for approval.`,
        type: 'ApprovalRequest',
        link: '/faculty-activities'
      });
    }

    await logAudit(req, 'CREATE_FACULTY_ACTIVITY', `Created ${type} activity: "${title}"`, null, activity);

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Error creating activity', error: err.message });
  }
});

// @desc    Update activity & version attachments
// @route   PUT /api/faculty/:id
router.put('/:id', protect, async (req, res) => {
  const { id } = req.params;

  try {
    const activity = await FacultyActivity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Authorization: only the owner or an admin can update
    if (req.user.role === 'Faculty' && activity.facultyId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this activity' });
    }

    // Check if user is uploading a newer version of an existing attachment
    const updatedAttachments = [];
    if (req.body.attachments) {
      for (const newAtt of req.body.attachments) {
        const existing = activity.attachments.find(a => a.name === newAtt.name);
        if (existing) {
          // If URL is changed, increment version
          if (existing.url !== newAtt.url) {
            newAtt.version = (existing.version || 1) + 1;
          } else {
            newAtt.version = existing.version || 1;
          }
        } else {
          newAtt.version = 1;
        }
        updatedAttachments.push(newAtt);
      }
      req.body.attachments = updatedAttachments;
    }

    // Force status reset if edited by faculty (resubmit to workflow)
    if (req.user.role === 'Faculty') {
      req.body.verificationStatus = 'Pending';
    }

    const updated = await FacultyActivity.findByIdAndUpdate(id, req.body, { new: true });
    
    await logAudit(req, 'UPDATE_FACULTY_ACTIVITY', `Updated activity ${id}`, activity, updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating activity', error: err.message });
  }
});

// @desc    Verify (Approve / Reject) Activity
// @route   POST /api/faculty/:id/verify
router.post('/:id/verify', protect, authorize('HOD', 'IQAC', 'Admin'), async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body; // status: 'HOD_Approved', 'IQAC_Approved', 'Rejected'

  if (!['HOD_Approved', 'IQAC_Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid verification status' });
  }

  try {
    const activity = await FacultyActivity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Role workflow constraints
    if (req.user.role === 'HOD') {
      if (status === 'IQAC_Approved') {
        return res.status(403).json({ message: 'HOD can only perform HOD_Approved or Rejected actions' });
      }
      if (activity.department !== req.user.department) {
        return res.status(403).json({ message: 'Cannot approve activities outside your department' });
      }
    }

    if (req.user.role === 'IQAC' && status === 'HOD_Approved') {
      return res.status(403).json({ message: 'IQAC must perform final IQAC_Approved or Rejected actions' });
    }

    const before = { ...activity };
    activity.verificationStatus = status;
    activity.verifiedBy = String(req.user._id);
    if (status === 'Rejected') {
      activity.rejectionReason = rejectionReason || 'No reason provided';
    } else {
      activity.rejectionReason = undefined;
    }

    await activity.save();

    // Trigger Notification to Faculty owner
    await Notification.create({
      recipientId: activity.facultyId,
      senderId: String(req.user._id),
      senderName: req.user.name,
      title: `Activity ${status === 'Rejected' ? 'Rejected' : 'Approved'}`,
      message: `Your activity "${activity.title}" was ${status === 'Rejected' ? 'rejected' : 'approved'} by ${req.user.role}.`,
      type: 'VerificationUpdate',
      link: '/faculty-activities'
    });

    // If HOD Approved, notify IQAC
    if (status === 'HOD_Approved') {
      const iqacs = await User.find({ role: 'IQAC' });
      for (const iqac of iqacs) {
        await Notification.create({
          recipientId: String(iqac._id),
          senderId: String(req.user._id),
          senderName: req.user.name,
          title: 'Final IQAC Approval Required',
          message: `HOD approved "${activity.title}". IQAC review requested.`,
          type: 'ApprovalRequest',
          link: '/faculty-activities'
        });
      }
    }

    // Recalculate faculty API score on final IQAC approval or rejection after previous approval
    if (status === 'IQAC_Approved' || before.verificationStatus === 'IQAC_Approved') {
      await calculateAndSaveApiScore(activity.facultyId);
    }

    await logAudit(req, 'VERIFY_FACULTY_ACTIVITY', `Verified activity status to ${status}`, before, activity);

    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Error verifying activity', error: err.message });
  }
});

// @desc    Delete Activity
// @route   DELETE /api/faculty/:id
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params;

  try {
    const activity = await FacultyActivity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (req.user.role === 'Faculty' && activity.facultyId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this activity' });
    }

    await FacultyActivity.findByIdAndDelete(id);
    await logAudit(req, 'DELETE_FACULTY_ACTIVITY', `Deleted activity "${activity.title}"`, activity, null);

    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting activity', error: err.message });
  }
});

export default router;
