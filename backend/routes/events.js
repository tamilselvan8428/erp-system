import express from 'express';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { mapActivityToAccreditation } from '../utils/accreditationMapper.js';
import { calculateAndSaveApiScore } from '../utils/apiScoreGenerator.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const { organizerId, department, status, type } = req.query;
  const query = {};

  if (status) query.verificationStatus = status;
  if (type) query.type = type;

  if (req.user.role === 'Faculty') {
    query.department = req.user.department;
  } else if (req.user.role === 'HOD') {
    query.department = req.user.department;
    if (organizerId) query.organizerId = organizerId;
  } else if (req.user.role === 'Student') {
    return res.status(403).json({ message: 'Students cannot access event coordination details' });
  } else {
    if (department) query.department = department;
    if (organizerId) query.organizerId = organizerId;
  }

  try {
    const list = await Event.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving events', error: err.message });
  }
});

router.post('/', protect, authorize('Faculty', 'HOD', 'Admin'), async (req, res) => {
  const { type, title, description, startDate, endDate, venue, internalExternal, targetedAudience, participantsCount, budgetSanctioned, budgetSpent, attachments, photos } = req.body;

  try {
    const organizerId = String(req.user._id);
    const user = await User.findById(organizerId);
    const mapping = mapActivityToAccreditation('Event', type);

    const event = await Event.create({
      organizerId,
      organizerName: user.name,
      department: user.department,
      type,
      title,
      description,
      startDate,
      endDate,
      venue,
      internalExternal,
      targetedAudience,
      participantsCount: participantsCount || 0,
      budgetSanctioned: budgetSanctioned || 0,
      budgetSpent: budgetSpent || 0,
      attachments: attachments || [],
      photos: photos || [],
      accreditationMapping: mapping,
      verificationStatus: 'Pending'
    });

    const hods = await User.find({ role: 'HOD', department: user.department });
    for (const hod of hods) {
      await Notification.create({
        recipientId: String(hod._id),
        senderId: organizerId,
        senderName: user.name,
        title: 'New Event Approval Request',
        message: `${user.name} logged an event: "${title}". Review requested.`,
        type: 'ApprovalRequest',
        link: '/events-outreach'
      });
    }

    await logAudit(req, 'CREATE_EVENT', `Created event: "${title}"`, null, event);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.user.role === 'Faculty' && event.organizerId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized edits' });
    }

    if (req.user.role === 'Faculty') req.body.verificationStatus = 'Pending';
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await logAudit(req, 'UPDATE_EVENT', `Updated event details of ${event.title}`, event, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
});

router.post('/:id/verify', protect, authorize('HOD', 'IQAC', 'Admin'), async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const before = { ...event };
    event.verificationStatus = status;
    event.verifiedBy = String(req.user._id);
    if (status === 'Rejected') event.rejectionReason = rejectionReason;

    await event.save();

    await Notification.create({
      recipientId: event.organizerId,
      senderId: String(req.user._id),
      senderName: req.user.name,
      title: `Event ${status === 'Rejected' ? 'Rejected' : 'Approved'}`,
      message: `Your event entry "${event.title}" was ${status === 'Rejected' ? 'rejected' : 'approved'} by ${req.user.role}.`,
      type: 'VerificationUpdate',
      link: '/events-outreach'
    });

    if (status === 'HOD_Approved') {
      const iqacs = await User.find({ role: 'IQAC' });
      for (const iqac of iqacs) {
        await Notification.create({
          recipientId: String(iqac._id),
          senderId: String(req.user._id),
          senderName: req.user.name,
          title: 'IQAC Event Review',
          message: `HOD approved event "${event.title}". Final approval pending.`,
          type: 'ApprovalRequest',
          link: '/events-outreach'
        });
      }
    }

    if (status === 'IQAC_Approved' || before.verificationStatus === 'IQAC_Approved') {
      await calculateAndSaveApiScore(event.organizerId);
    }

    await logAudit(req, 'VERIFY_EVENT', `Verified event status to ${status}`, before, event);
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error verifying event', error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.user.role === 'Faculty' && event.organizerId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized deletion' });
    }
    await Event.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE_EVENT', `Deleted event "${event.title}"`, event, null);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
});

export default router;
