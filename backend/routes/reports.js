import express from 'express';
import { FacultyActivity } from '../models/FacultyActivity.js';
import { Publication } from '../models/Publication.js';
import { Patent } from '../models/Patent.js';
import { GrantAndProject } from '../models/GrantAndProject.js';
import { StudentAchievement } from '../models/StudentAchievement.js';
import { User } from '../models/User.js';
import { generatePDFReport } from '../utils/pdfGenerator.js';
import { generateExcelReport } from '../utils/excelGenerator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/export', protect, async (req, res) => {
  const { format, reportType, facultyId, department, academicYear } = req.query;

  if (!format || !reportType) {
    return res.status(400).json({ message: 'Please provide format (pdf/excel) and reportType' });
  }

  try {
    let headers = [];
    let rows = [];
    let title = 'FSAIS Report';
    let subtitle = `Academic Year: ${academicYear || 'All'} | Department: ${department || 'All'}`;

    const query = {};
    if (department) query.department = department;

    // 1. GATHER DATA BASED ON REPORT TYPE
    if (reportType === 'faculty') {
      const targetFacultyId = facultyId || String(req.user._id);
      const user = await User.findById(targetFacultyId);
      title = `${user.name} - Annual Academic Performance Report`;
      subtitle = `Designation: ${user.designation || 'Faculty'} | Department: ${user.department} | API Score: ${user.apiScore}`;

      headers = ['Category/Type', 'Title', 'Organizer/Publisher', 'Date Occurred', 'Status/Detail'];

      // Gather FDPs
      const activities = await FacultyActivity.find({ facultyId: targetFacultyId });
      activities.forEach(a => {
        rows.push([a.type, a.title, a.organizer, new Date(a.startDate).toLocaleDateString(), a.verificationStatus]);
      });

      // Gather Publications
      const pubs = await Publication.find({ authorId: targetFacultyId });
      pubs.forEach(p => {
        rows.push([`Pub - ${p.type}`, p.title, p.journalConferenceName, new Date(p.publicationDate).toLocaleDateString(), p.verificationStatus]);
      });

      // Gather Patents
      const patents = await Patent.find({ inventorId: targetFacultyId });
      patents.forEach(pt => {
        rows.push(['Patent', pt.title, pt.applicationNumber, new Date(pt.filingDate).toLocaleDateString(), pt.status]);
      });

      // Gather Projects
      const projects = await GrantAndProject.find({ investigatorId: targetFacultyId });
      projects.forEach(pr => {
        rows.push([pr.type, pr.title, pr.fundingAgency, new Date(pr.startDate).toLocaleDateString(), `Rs. ${pr.amountSanctioned}`]);
      });

    } else if (reportType === 'department') {
      title = `Department Report - ${department || req.user.department}`;
      headers = ['Faculty Name', 'Activity Type', 'Title', 'Date Occurred', 'Status'];

      const queryDept = department || req.user.department;
      const activities = await FacultyActivity.find({ department: queryDept });
      activities.forEach(a => {
        rows.push([a.facultyName, a.type, a.title, new Date(a.startDate).toLocaleDateString(), a.verificationStatus]);
      });

      const pubs = await Publication.find({ department: queryDept });
      pubs.forEach(p => {
        rows.push([p.authorName, `Pub - ${p.type}`, p.title, new Date(p.publicationDate).toLocaleDateString(), p.verificationStatus]);
      });

    } else if (reportType === 'research') {
      title = 'Research & Publications Summary';
      headers = ['Researcher', 'Type', 'Title', 'Journal/Agency', 'Metrics/Funding', 'Status'];

      // Collect Publications
      const pubs = await Publication.find(query);
      pubs.forEach(p => {
        rows.push([p.authorName, p.type, p.title, p.journalConferenceName, `IF: ${p.impactFactor || 0}`, p.verificationStatus]);
      });

      // Collect Grants
      const grants = await GrantAndProject.find(query);
      grants.forEach(g => {
        rows.push([g.investigatorName, g.type, g.title, g.fundingAgency, `INR ${g.amountSanctioned}`, g.verificationStatus]);
      });

    } else if (reportType === 'student') {
      title = 'Student Placement & Achievements Report';
      headers = ['Student Name', 'Category', 'Activity Title', 'Organization', 'Date', 'Status'];

      const achievements = await StudentAchievement.find(query);
      achievements.forEach(a => {
        rows.push([a.studentName, a.type, a.title, a.organization, new Date(a.dateOccurred).toLocaleDateString(), a.verificationStatus]);
      });

    } else if (reportType === 'naac' || reportType === 'nba' || reportType === 'nirf') {
      title = `${reportType.toUpperCase()} Accreditation Audit Trail`;
      headers = ['Accreditation Code', 'Source Module', 'Item Title', 'Faculty Name', 'Status'];

      const codeField = reportType.toLowerCase(); // 'naac' / 'nba' / 'nirf'

      // Query from FacultyActivity
      const acts = await FacultyActivity.find(query);
      acts.forEach(a => {
        const codes = a.accreditationMapping?.[codeField] || [];
        if (codes.length > 0) {
          rows.push([codes.join(', '), a.type, a.title, a.facultyName, a.verificationStatus]);
        }
      });

      // Query Publications
      const pubs = await Publication.find(query);
      pubs.forEach(p => {
        const codes = p.accreditationMapping?.[codeField] || [];
        if (codes.length > 0) {
          rows.push([codes.join(', '), `Pub - ${p.type}`, p.title, p.authorName, p.verificationStatus]);
        }
      });

      // Query Patents
      const patents = await Patent.find(query);
      patents.forEach(pt => {
        const codes = pt.accreditationMapping?.[codeField] || [];
        if (codes.length > 0) {
          rows.push([codes.join(', '), 'Patent', pt.title, pt.inventorName, pt.verificationStatus]);
        }
      });

    } else {
      // Default IQAC Audit
      title = 'IQAC General Audit Trail Report';
      headers = ['Contributor', 'Activity Type', 'Title', 'Accreditation', 'Audit Status'];

      const acts = await FacultyActivity.find(query);
      acts.forEach(a => {
        rows.push([a.facultyName, a.type, a.title, `NAAC: ${a.accreditationMapping?.naac?.join(',') || 'N/A'}`, a.verificationStatus]);
      });
    }

    // 2. GENERATE AND RESPOND WITH BUFFERED FORMAT
    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(title, subtitle, headers, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
      return res.send(pdfBuffer);
    } else {
      const excelBuffer = generateExcelReport(reportType.toUpperCase(), headers, rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
      return res.send(excelBuffer);
    }

  } catch (err) {
    res.status(500).json({ message: 'Error generating report file', error: err.message });
  }
});

export default router;
