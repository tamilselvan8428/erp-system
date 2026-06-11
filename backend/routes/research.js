import express from 'express';
import { Publication } from '../models/Publication.js';
import { Patent } from '../models/Patent.js';
import { GrantAndProject } from '../models/GrantAndProject.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { mapActivityToAccreditation } from '../utils/accreditationMapper.js';
import { calculateAndSaveApiScore } from '../utils/apiScoreGenerator.js';

const router = express.Router();

// Helper to handle workflow notifications
const sendWorkflowNotifications = async (user, type, title, link) => {
  const hods = await User.find({ role: 'HOD', department: user.department });
  for (const hod of hods) {
    await Notification.create({
      recipientId: String(hod._id),
      senderId: String(user._id),
      senderName: user.name,
      title: 'Research Review Needed',
      message: `${user.name} logged a new ${type}: "${title}". Review requested.`,
      type: 'ApprovalRequest',
      link
    });
  }
};

/* =========================================================================
   PUBLICATIONS SECTION
   ========================================================================= */

router.get('/publications', protect, async (req, res) => {
  const { authorId, department, status, academicYear } = req.query;
  const query = {};

  if (status) query.verificationStatus = status;

  if (req.user.role === 'Faculty') {
    query.department = req.user.department;
  } else if (req.user.role === 'HOD') {
    query.department = req.user.department;
    if (authorId) query.authorId = authorId;
  } else {
    if (department) query.department = department;
    if (authorId) query.authorId = authorId;
  }

  try {
    const list = await Publication.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching publications', error: err.message });
  }
});

router.post('/publications', protect, authorize('Faculty', 'HOD', 'Admin'), async (req, res) => {
  const { type, title, journalConferenceName, issnIsbn, publisher, publicationDate, volume, issue, pages, doi, impactFactor, citationCount, indexing, coAuthors, attachments } = req.body;

  try {
    const authorId = String(req.user._id);
    const authorUser = await User.findById(authorId);
    const mapping = mapActivityToAccreditation('Publication', type);

    const pub = await Publication.create({
      authorId,
      authorName: authorUser.name,
      department: authorUser.department,
      type,
      title,
      journalConferenceName,
      issnIsbn,
      publisher,
      publicationDate,
      volume,
      issue,
      pages,
      doi,
      impactFactor: impactFactor || 0,
      citationCount: citationCount || 0,
      indexing: indexing || [],
      coAuthors: coAuthors || [],
      attachments: attachments || [],
      accreditationMapping: mapping,
      verificationStatus: 'Pending'
    });

    await sendWorkflowNotifications(authorUser, type, title, '/research-tracker');
    await logAudit(req, 'CREATE_PUBLICATION', `Logged publication: "${title}"`, null, pub);

    res.status(201).json(pub);
  } catch (err) {
    res.status(500).json({ message: 'Error creating publication', error: err.message });
  }
});

router.put('/publications/:id', protect, async (req, res) => {
  try {
    const pub = await Publication.findById(req.params.id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });
    if (req.user.role === 'Faculty' && pub.authorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized modification' });
    }

    if (req.user.role === 'Faculty') req.body.verificationStatus = 'Pending';
    const updated = await Publication.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    await logAudit(req, 'UPDATE_PUBLICATION', `Updated publication ${pub.title}`, pub, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating publication', error: err.message });
  }
});

router.post('/publications/:id/verify', protect, authorize('HOD', 'IQAC', 'Admin'), async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const pub = await Publication.findById(req.params.id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });

    if (req.user.role === 'HOD' && pub.department !== req.user.department) {
      return res.status(403).json({ message: 'Cannot verify publications outside your department' });
    }

    const before = { ...pub };
    pub.verificationStatus = status;
    pub.verifiedBy = String(req.user._id);
    if (status === 'Rejected') pub.rejectionReason = rejectionReason;

    await pub.save();

    await Notification.create({
      recipientId: pub.authorId,
      senderId: String(req.user._id),
      senderName: req.user.name,
      title: `Publication ${status === 'Rejected' ? 'Rejected' : 'Approved'}`,
      message: `Your publication "${pub.title}" was ${status === 'Rejected' ? 'rejected' : 'approved'} by ${req.user.role}.`,
      type: 'VerificationUpdate',
      link: '/research-tracker'
    });

    if (status === 'HOD_Approved') {
      const iqacs = await User.find({ role: 'IQAC' });
      for (const iqac of iqacs) {
        await Notification.create({
          recipientId: String(iqac._id),
          senderId: String(req.user._id),
          senderName: req.user.name,
          title: 'IQAC Publication Review',
          message: `HOD approved publication "${pub.title}". Final approval pending.`,
          type: 'ApprovalRequest',
          link: '/research-tracker'
        });
      }
    }

    if (status === 'IQAC_Approved' || before.verificationStatus === 'IQAC_Approved') {
      await calculateAndSaveApiScore(pub.authorId);
    }

    await logAudit(req, 'VERIFY_PUBLICATION', `Verified publication status to ${status}`, before, pub);
    res.json(pub);
  } catch (err) {
    res.status(500).json({ message: 'Error verifying publication', error: err.message });
  }
});

router.delete('/publications/:id', protect, async (req, res) => {
  try {
    const pub = await Publication.findById(req.params.id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });
    if (req.user.role === 'Faculty' && pub.authorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized deletion' });
    }
    await Publication.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE_PUBLICATION', `Deleted publication "${pub.title}"`, pub, null);
    res.json({ message: 'Publication deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting publication', error: err.message });
  }
});

/* =========================================================================
   PATENTS SECTION
   ========================================================================= */

router.get('/patents', protect, async (req, res) => {
  const { inventorId, department, status } = req.query;
  const query = {};

  if (status) query.verificationStatus = status;

  if (req.user.role === 'Faculty') {
    query.department = req.user.department;
  } else if (req.user.role === 'HOD') {
    query.department = req.user.department;
    if (inventorId) query.inventorId = inventorId;
  } else {
    if (department) query.department = department;
    if (inventorId) query.inventorId = inventorId;
  }

  try {
    const list = await Patent.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching patents', error: err.message });
  }
});

router.post('/patents', protect, authorize('Faculty', 'HOD', 'Admin'), async (req, res) => {
  const { title, applicationNumber, filingDate, status, patentNumber, grantDate, country, coInventors, attachments } = req.body;

  try {
    const inventorId = String(req.user._id);
    const inventorUser = await User.findById(inventorId);
    const mapping = mapActivityToAccreditation('Patent', status);

    const pat = await Patent.create({
      inventorId,
      inventorName: inventorUser.name,
      department: inventorUser.department,
      title,
      applicationNumber,
      filingDate,
      status,
      patentNumber,
      grantDate,
      country: country || 'India',
      coInventors: coInventors || [],
      attachments: attachments || [],
      accreditationMapping: mapping,
      verificationStatus: 'Pending'
    });

    await sendWorkflowNotifications(inventorUser, 'Patent', title, '/research-tracker');
    await logAudit(req, 'CREATE_PATENT', `Logged patent: "${title}"`, null, pat);

    res.status(201).json(pat);
  } catch (err) {
    res.status(500).json({ message: 'Error creating patent', error: err.message });
  }
});

router.put('/patents/:id', protect, async (req, res) => {
  try {
    const pat = await Patent.findById(req.params.id);
    if (!pat) return res.status(404).json({ message: 'Patent not found' });
    if (req.user.role === 'Faculty' && pat.inventorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'Faculty') req.body.verificationStatus = 'Pending';
    const updated = await Patent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    await logAudit(req, 'UPDATE_PATENT', `Updated patent ${pat.title}`, pat, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating patent', error: err.message });
  }
});

router.post('/patents/:id/verify', protect, authorize('HOD', 'IQAC', 'Admin'), async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const pat = await Patent.findById(req.params.id);
    if (!pat) return res.status(404).json({ message: 'Patent not found' });

    if (req.user.role === 'HOD' && pat.department !== req.user.department) {
      return res.status(403).json({ message: 'Cannot verify patents outside your department' });
    }

    const before = { ...pat };
    pat.verificationStatus = status;
    pat.verifiedBy = String(req.user._id);
    if (status === 'Rejected') pat.rejectionReason = rejectionReason;

    await pat.save();

    await Notification.create({
      recipientId: pat.inventorId,
      senderId: String(req.user._id),
      senderName: req.user.name,
      title: `Patent ${status === 'Rejected' ? 'Rejected' : 'Approved'}`,
      message: `Your patent "${pat.title}" was ${status === 'Rejected' ? 'rejected' : 'approved'} by ${req.user.role}.`,
      type: 'VerificationUpdate',
      link: '/research-tracker'
    });

    if (status === 'HOD_Approved') {
      const iqacs = await User.find({ role: 'IQAC' });
      for (const iqac of iqacs) {
        await Notification.create({
          recipientId: String(iqac._id),
          senderId: String(req.user._id),
          senderName: req.user.name,
          title: 'IQAC Patent Review',
          message: `HOD approved patent "${pat.title}". Final approval pending.`,
          type: 'ApprovalRequest',
          link: '/research-tracker'
        });
      }
    }

    if (status === 'IQAC_Approved' || before.verificationStatus === 'IQAC_Approved') {
      await calculateAndSaveApiScore(pat.inventorId);
    }

    await logAudit(req, 'VERIFY_PATENT', `Verified patent status to ${status}`, before, pat);
    res.json(pat);
  } catch (err) {
    res.status(500).json({ message: 'Error verifying patent', error: err.message });
  }
});

router.delete('/patents/:id', protect, async (req, res) => {
  try {
    const pat = await Patent.findById(req.params.id);
    if (!pat) return res.status(404).json({ message: 'Patent not found' });
    if (req.user.role === 'Faculty' && pat.inventorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Patent.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE_PATENT', `Deleted patent "${pat.title}"`, pat, null);
    res.json({ message: 'Patent deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting patent', error: err.message });
  }
});

/* =========================================================================
   GRANTS SECTION
   ========================================================================= */

router.get('/grants', protect, async (req, res) => {
  const { investigatorId, department, status } = req.query;
  const query = {};

  if (status) query.verificationStatus = status;

  if (req.user.role === 'Faculty') {
    query.department = req.user.department;
  } else if (req.user.role === 'HOD') {
    query.department = req.user.department;
    if (investigatorId) query.investigatorId = investigatorId;
  } else {
    if (department) query.department = department;
    if (investigatorId) query.investigatorId = investigatorId;
  }

  try {
    const list = await GrantAndProject.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grants', error: err.message });
  }
});

router.post('/grants', protect, authorize('Faculty', 'HOD', 'Admin'), async (req, res) => {
  const { title, fundingAgency, type, amountSanctioned, durationYears, startDate, endDate, status, projectOutcome, attachments } = req.body;

  try {
    const investigatorId = String(req.user._id);
    const investigatorUser = await User.findById(investigatorId);
    const mapping = mapActivityToAccreditation('GrantAndProject', type);

    const grant = await GrantAndProject.create({
      investigatorId,
      investigatorName: investigatorUser.name,
      department: investigatorUser.department,
      title,
      fundingAgency,
      type,
      amountSanctioned,
      durationYears,
      startDate,
      endDate,
      status,
      projectOutcome,
      attachments: attachments || [],
      accreditationMapping: mapping,
      verificationStatus: 'Pending'
    });

    await sendWorkflowNotifications(investigatorUser, type, title, '/research-tracker');
    await logAudit(req, 'CREATE_GRANT', `Logged funding project: "${title}"`, null, grant);

    res.status(201).json(grant);
  } catch (err) {
    res.status(500).json({ message: 'Error creating grant record', error: err.message });
  }
});

router.put('/grants/:id', protect, async (req, res) => {
  try {
    const grant = await GrantAndProject.findById(req.params.id);
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    if (req.user.role === 'Faculty' && grant.investigatorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'Faculty') req.body.verificationStatus = 'Pending';
    const updated = await GrantAndProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    await logAudit(req, 'UPDATE_GRANT', `Updated grant ${grant.title}`, grant, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating grant', error: err.message });
  }
});

router.post('/grants/:id/verify', protect, authorize('HOD', 'IQAC', 'Admin'), async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const grant = await GrantAndProject.findById(req.params.id);
    if (!grant) return res.status(404).json({ message: 'Grant not found' });

    if (req.user.role === 'HOD' && grant.department !== req.user.department) {
      return res.status(403).json({ message: 'Cannot verify grants/projects outside your department' });
    }

    const before = { ...grant };
    grant.verificationStatus = status;
    grant.verifiedBy = String(req.user._id);
    if (status === 'Rejected') grant.rejectionReason = rejectionReason;

    await grant.save();

    await Notification.create({
      recipientId: grant.investigatorId,
      senderId: String(req.user._id),
      senderName: req.user.name,
      title: `Grant/Consultancy ${status === 'Rejected' ? 'Rejected' : 'Approved'}`,
      message: `Your grant entry "${grant.title}" was ${status === 'Rejected' ? 'rejected' : 'approved'} by ${req.user.role}.`,
      type: 'VerificationUpdate',
      link: '/research-tracker'
    });

    if (status === 'HOD_Approved') {
      const iqacs = await User.find({ role: 'IQAC' });
      for (const iqac of iqacs) {
        await Notification.create({
          recipientId: String(iqac._id),
          senderId: String(req.user._id),
          senderName: req.user.name,
          title: 'IQAC Grant Review',
          message: `HOD approved grant/project "${grant.title}". Final approval pending.`,
          type: 'ApprovalRequest',
          link: '/research-tracker'
        });
      }
    }

    if (status === 'IQAC_Approved' || before.verificationStatus === 'IQAC_Approved') {
      await calculateAndSaveApiScore(grant.investigatorId);
    }

    await logAudit(req, 'VERIFY_GRANT', `Verified funding project status to ${status}`, before, grant);
    res.json(grant);
  } catch (err) {
    res.status(500).json({ message: 'Error verifying grant', error: err.message });
  }
});

router.delete('/grants/:id', protect, async (req, res) => {
  try {
    const grant = await GrantAndProject.findById(req.params.id);
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    if (req.user.role === 'Faculty' && grant.investigatorId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await GrantAndProject.findByIdAndDelete(req.params.id);
    await logAudit(req, 'DELETE_GRANT', `Deleted grant "${grant.title}"`, grant, null);
    res.json({ message: 'Grant deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting grant', error: err.message });
  }
});

export default router;
