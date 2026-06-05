import express from 'express';
import { IndustryInteraction } from '../models/IndustryInteraction.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { mapActivityToAccreditation } from '../utils/accreditationMapper.js';
import { calculateAndSaveApiScore } from '../utils/apiScoreGenerator.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const { coordinatorId, department, status, type } = req.query;
  const query = {};

  if (status) query.verificationStatus = status;
  if (type) query.type = type;

  if (req.user.role === 'Faculty') {
    query.coordinatorId = String(req.user._id);
  } else if (req.user.role === 'HOD') {
    query.department = req.user.department;
    if (coordinatorId) query.coordinatorId = coordinatorId;
  } else if (req.user.role === 'Student') {
    return res.status(403).json({ message: 'Forbidden' });
  } else {
    if (department) query.department = department;
    if (coordinatorId) query.coordinatorId = coordinatorId;
  }

  try {
    const list = await IndustryInteraction.find(query).sort({ createdAt: -1 });
    
    // Smart validity checking: Check and update expired MoUs on-the-fly
    const now = new Date();
    let updatedList = [];
    for (const item of list) {
      if (
        item.type === 'MoU' && 
        item.status === 'Active' && 
        item.validityEndDate && 
        new Date(item.validityEndDate) < now
      ) {
        item.status = 'Expired';
        // Note: For mockDb/Mongoose compatibility, we call save on a fresh instance or update directly
        const fresh = await IndustryInteraction.findByIdAndUpdate(item._id, { status: 'Expired' }, { new: true });
        
        // Push notification alert
        await Notification.create({
          recipientId: item.coordinatorId,
          senderName: 'System Monitor',
          title: 'MoU Expired Alert',
          message: `The MoU with "${item.organizationName}" has expired on ${new Date(item.validityEndDate).toLocaleDateString()}.`,
          type: 'Reminder',
          link: '/industry-interaction'
        });
        updatedList.push(fresh);
      } else {
        updatedList.push(item);
      }
    }

    res.json(updatedList);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving industry links', error: err.message });
  }
});

router.post('/', protect, authorize('Faculty', 'HOD', 'Admin'), async (req, res) => {
  const { type, organizationName, contactPerson, contactEmail, dateOccurred, validityEndDate, description, attachments } = req.body;

  try {
    const coordinatorId = String(req.user._id);
    const user = await User.findById(coordinatorId);
    const mapping = mapActivityToAccreditation('IndustryInteraction', type);

    const link = await IndustryInteraction.create({
      coordinatorId,
      coordinatorName: user.name,
      department: user.department,
      type,
      organizationName,
      contactPerson,
      contactEmail,
      dateOccurred,
      validityEndDate: type === 'MoU' ? validityEndDate : undefined,
      description,
      attachments: attachments || [],
      accreditationMapping: mapping,
      status: type === 'MoU' ? 'Active' : 'Pending',
      verificationStatus: 'Pending'
    });

    const hods = await User.find({ role: 'HOD', department: user.department });
    for (const hod of hods) {
      await Notification.create({
        recipientId: String(hod._id),
        senderId: coordinatorId,
        senderName: user.name,
        title: 'New Industry Link Request',
        message: `${user.name} registered a ${type} with "${organizationName}". Review requested.`,
        type: 'ApprovalRequest',
        link: '/industry-interaction'
      });
    }

    await logAudit(req, 'CREATE_INDUSTRY_INTERACTION', `Logged ${type} with ${organizationName}`, null, link);
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ message: 'Error logging industry entry', error: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const item = await IndustryInteraction.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Record not found' });
    if (req.user.role === 'Faculty' && item.coordinatorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized edits' });
    }

    if (req.user.role === 'Faculty') req.body.verificationStatus = 'Pending';
    const updated = await IndustryInteraction.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await logAudit(req, 'UPDATE_INDUSTRY_INTERACTION', `Updated industry relation with ${item.organizationName}`, item, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating record', error: err.message });
  }
});

router.post('/:id/verify', protect, authorize('HOD', 'IQAC', 'Admin'), async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const item = await IndustryInteraction.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Record not found' });

    const before = { ...item };
    item.verificationStatus = status;
    item.verifiedBy = String(req.user._id);
    if (status === 'Rejected') item.rejectionReason = rejectionReason;

    await item.save();

    await Notification.create({
      recipientId: item.coordinatorId,
      senderId: String(req.user._id),
      senderName: req.user.name,
      title: `Industry Link ${status === 'Rejected' ? 'Rejected' : 'Approved'}`,
      message: `Your industry link "${item.organizationName}" was ${status === 'Rejected' ? 'rejected' : 'approved'} by ${req.user.role}.`,
      type: 'VerificationUpdate',
      link: '/industry-interaction'
    });

    if (status === 'HOD_Approved') {
      const iqacs = await User.find({ role: 'IQAC' });
      for (const iqac of iqacs) {
        await Notification.create({
          recipientId: String(iqac._id),
          senderId: String(req.user._id),
          senderName: req.user.name,
          title: 'IQAC Industry Link Review',
          message: `HOD approved MoU/Visit "${item.organizationName}". Final approval pending.`,
          type: 'ApprovalRequest',
          link: '/industry-interaction'
        });
      }
    }

    if (status === 'IQAC_Approved' || before.verificationStatus === 'IQAC_Approved') {
      await calculateAndSaveApiScore(item.coordinatorId);
    }

    await logAudit(req, 'VERIFY_INDUSTRY_INTERACTION', `Verified industry record to ${status}`, before, item);
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error verifying record', error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await IndustryInteraction.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Record not found' });
    if (req.user.role === 'Faculty' && item.coordinatorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await IndustryInteraction.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE_INDUSTRY_INTERACTION', `Deleted record with ${item.organizationName}`, item, null);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting record', error: err.message });
  }
});

export default router;
