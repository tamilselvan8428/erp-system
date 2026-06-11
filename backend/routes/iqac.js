import express from 'express';
import { User } from '../models/User.js';
import { FacultyActivity } from '../models/FacultyActivity.js';
import { Publication } from '../models/Publication.js';
import { Patent } from '../models/Patent.js';
import { GrantAndProject } from '../models/GrantAndProject.js';
import { StudentAchievement } from '../models/StudentAchievement.js';
import { Event } from '../models/Event.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

const router = express.Router();

// @desc    Get Global Analytics for Dashboards
// @route   GET /api/iqac/analytics
router.get('/analytics', protect, async (req, res) => {
  const { department, academicYear } = req.query;
  const matchQuery = {};
  if (req.user.role === 'HOD') {
    matchQuery.department = req.user.department;
  } else if (department) {
    matchQuery.department = department;
  }
  if (academicYear) matchQuery.academicYear = academicYear;

  try {
    // Collect counts for KPIs
    const publicationsCount = await Publication.countDocuments({ ...matchQuery, verificationStatus: 'IQAC_Approved' });
    const patentsCount = await Patent.countDocuments({ ...matchQuery, verificationStatus: 'IQAC_Approved' });
    const fdpsCount = await FacultyActivity.countDocuments({ ...matchQuery, type: 'FDP', verificationStatus: 'IQAC_Approved' });
    const grantsCount = await GrantAndProject.countDocuments({ ...matchQuery, type: 'Research Grant', verificationStatus: 'IQAC_Approved' });
    const consultancyCount = await GrantAndProject.countDocuments({ ...matchQuery, type: 'Consultancy', verificationStatus: 'IQAC_Approved' });
    const internshipsCount = await StudentAchievement.countDocuments({ ...matchQuery, type: 'Internship', verificationStatus: 'HOD_Approved' });
    const placementsCount = await StudentAchievement.countDocuments({ ...matchQuery, type: 'Placement Offer', verificationStatus: 'HOD_Approved' });

    // Calculate Consultancy Revenue
    const consultancyProjects = await GrantAndProject.find({ ...matchQuery, type: 'Consultancy', verificationStatus: 'IQAC_Approved' });
    const consultancyRevenue = consultancyProjects.reduce((sum, item) => sum + (item.amountSanctioned || 0), 0);

    const grantsProjects = await GrantAndProject.find({ ...matchQuery, type: 'Research Grant', verificationStatus: 'IQAC_Approved' });
    const grantsRevenue = grantsProjects.reduce((sum, item) => sum + (item.amountSanctioned || 0), 0);

    // Dynamic charts dataset
    // Publications by Department
    const depts = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
    const publicationsByDept = [];
    const placementsByDept = [];

    for (const d of depts) {
      const pubCount = await Publication.countDocuments({ department: d, verificationStatus: 'IQAC_Approved' });
      publicationsByDept.push({ name: d, value: pubCount });

      const placCount = await StudentAchievement.countDocuments({ department: d, type: 'Placement Offer', verificationStatus: 'HOD_Approved' });
      placementsByDept.push({ name: d, value: placCount });
    }

    // Publication trends by type
    const pubTypes = ['Journal', 'Conference', 'Book', 'Book Chapter'];
    const publicationsByType = [];
    for (const t of pubTypes) {
      const count = await Publication.countDocuments({ ...matchQuery, type: t, verificationStatus: 'IQAC_Approved' });
      publicationsByType.push({ name: t, value: count });
    }

    res.json({
      kpis: {
        publications: publicationsCount,
        patents: patentsCount,
        fdps: fdpsCount,
        grants: grantsCount,
        consultancy: consultancyCount,
        internships: internshipsCount,
        placements: placementsCount,
        consultancyRevenue,
        grantsRevenue
      },
      charts: {
        publicationsByDept,
        placementsByDept,
        publicationsByType
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving analytics data', error: err.message });
  }
});

// @desc    Submit Monthly Academic Closure
// @route   POST /api/iqac/submit-closure
router.post('/submit-closure', protect, authorize('Faculty'), async (req, res) => {
  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ message: 'Please provide month and year' });
  }

  try {
    const facultyId = String(req.user._id);

    // SMART FEATURE: Check if they have any pending activities or publications
    // If they have any records created during this academic semester / year that are in 'Pending' status, warn them.
    const pendingAct = await FacultyActivity.countDocuments({ facultyId, verificationStatus: 'Pending' });
    const pendingPub = await Publication.countDocuments({ authorId: facultyId, verificationStatus: 'Pending' });
    const pendingPat = await Patent.countDocuments({ inventorId: facultyId, verificationStatus: 'Pending' });

    if (pendingAct > 0 || pendingPub > 0 || pendingPat > 0) {
      return res.status(400).json({
        message: `Academic Closure BLOCKED: You have ${pendingAct + pendingPub + pendingPat} pending activities awaiting HOD/IQAC review. Please resolve these entries before closing the month.`
      });
    }

    const user = await User.findById(facultyId);
    let closureList = user.monthlyClosureStatus || [];

    const existingIdx = closureList.findIndex(item => item.month === month && item.year === year);
    if (existingIdx >= 0) {
      closureList[existingIdx].closed = true;
      closureList[existingIdx].closedAt = new Date().toISOString();
    } else {
      closureList.push({
        month,
        year,
        closed: true,
        closedAt: new Date().toISOString()
      });
    }

    const updated = await User.findByIdAndUpdate(facultyId, { monthlyClosureStatus: closureList }, { new: true });
    await logAudit(req, 'MONTHLY_CLOSURE', `Completed monthly closure for ${month}/${year}`);

    res.json({
      message: `Monthly Academic Closure for ${month}/${year} completed successfully.`,
      monthlyClosureStatus: updated.monthlyClosureStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'Error saving closure status', error: err.message });
  }
});

// @desc    Get Closure status check
// @route   GET /api/iqac/closure-status
router.get('/closure-status', protect, async (req, res) => {
  try {
    if (req.user.role === 'Faculty') {
      const user = await User.findById(req.user._id);
      return res.json(user.monthlyClosureStatus || []);
    }

    // HODs / IQAC can view closure completion rates for their department
    const query = {};
    if (req.user.role === 'HOD') {
      query.department = req.user.department;
    }
    query.role = 'Faculty';

    const faculties = await User.find(query);
    const closureData = faculties.map(f => ({
      facultyId: f._id,
      name: f.name,
      department: f.department,
      closures: f.monthlyClosureStatus || []
    }));

    res.json(closureData);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving closure status list', error: err.message });
  }
});

export default router;
