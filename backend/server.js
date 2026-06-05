import './config/env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { FacultyActivity } from './models/FacultyActivity.js';
import { Publication } from './models/Publication.js';
import { Patent } from './models/Patent.js';
import { GrantAndProject } from './models/GrantAndProject.js';
import { StudentAchievement } from '../backend/models/StudentAchievement.js';

import authRoutes from './routes/auth.js';
import facultyRoutes from './routes/faculty.js';
import researchRoutes from './routes/research.js';
import eventsRoutes from './routes/events.js';
import industryRoutes from './routes/industry.js';
import studentRoutes from './routes/student.js';
import iqacRoutes from './routes/iqac.js';
import reportsRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import { upload } from './middleware/uploadMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// File Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    type: req.file.mimetype
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/iqac', iqacRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

// Simple healthcheck route
app.get('/api/health', (req, res) => res.json({ status: 'OK', database: process.env.USE_MOCK_DB === 'true' ? 'MockDB' : 'MongoDB' }));

// Seed function
const seedDemoData = async () => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return;

    console.log('🌱 Database is empty. Seeding default user roles and academic datasets...');
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Password123', salt);

    const users = [
      { name: 'Dr. Admin User', email: 'admin@sece.ac.in', password, role: 'Admin', department: 'IQAC', designation: 'Director IQAC', academicYear: '2025-2026' },
      { name: 'Dr. Principal User', email: 'principal@sece.ac.in', password, role: 'Principal', department: 'ADMIN', designation: 'Principal', academicYear: '2025-2026' },
      { name: 'Dr. IQAC Lead', email: 'iqac@sece.ac.in', password, role: 'IQAC', department: 'IQAC', designation: 'IQAC Manager', academicYear: '2025-2026' },
      { name: 'Dr. CSE HOD', email: 'hod@sece.ac.in', password, role: 'HOD', department: 'CSE', designation: 'HOD CSE', academicYear: '2025-2026' },
      { name: 'Dr. Rajesh Kumar', email: 'faculty@sece.ac.in', password, role: 'Faculty', department: 'CSE', designation: 'Associate Professor', facultyId: 'SECE-FAC-001', academicYear: '2025-2026', apiScore: 78 },
      { name: 'Adithya R', email: 'student@sece.ac.in', password, role: 'Student', department: 'CSE', designation: 'Student', studentId: '22CS001', academicYear: '2025-2026' }
    ];

    const seededUsers = [];
    for (const u of users) {
      const usr = await User.create(u);
      seededUsers.push(usr);
    }

    const faculty = seededUsers.find(u => u.role === 'Faculty');
    const student = seededUsers.find(u => u.role === 'Student');

    // Faculty Activity (FDP)
    await FacultyActivity.create({
      facultyId: String(faculty._id),
      facultyName: faculty.name,
      department: faculty.department,
      type: 'FDP',
      title: 'Advanced AI and Deep Learning Frameworks',
      organizer: 'IIT Madras',
      startDate: new Date('2025-10-10').toISOString(),
      endDate: new Date('2025-10-15').toISOString(),
      duration: 5,
      role: 'Participant',
      attachments: [{ name: 'FDP Certificate', type: 'Certificate', url: '/uploads/sample-cert.pdf', version: 1 }],
      verificationStatus: 'IQAC_Approved',
      accreditationMapping: { naac: ['6.3.3'], nba: ['Criterion 5.7'], nirf: ['FSPD'] }
    });

    // Publication (Approved)
    await Publication.create({
      authorId: String(faculty._id),
      authorName: faculty.name,
      department: faculty.department,
      type: 'Journal',
      title: 'Highly Scalable Edge Computing Architecture for Smart Agriculture',
      journalConferenceName: 'IEEE Internet of Things Journal',
      issnIsbn: '2327-4662',
      publisher: 'IEEE',
      publicationDate: new Date('2025-08-12').toISOString(),
      doi: '10.1109/JIOT.2025.12345',
      impactFactor: 8.2,
      indexing: ['Scopus', 'Web of Science'],
      verificationStatus: 'IQAC_Approved',
      accreditationMapping: { naac: ['3.4.5'], nba: ['Criterion 5.4'], nirf: ['PU'] }
    });

    // Publication (Pending HOD approval)
    await Publication.create({
      authorId: String(faculty._id),
      authorName: faculty.name,
      department: faculty.department,
      type: 'Conference',
      title: 'Blockchain Based Secure Academic Credentials Verification System',
      journalConferenceName: 'International Conference on Software Engineering 2026',
      issnIsbn: '978-3-16-148410-0',
      publicationDate: new Date('2026-03-01').toISOString(),
      verificationStatus: 'Pending',
      accreditationMapping: { naac: ['3.4.6'], nba: ['Criterion 5.4'] }
    });

    // Patent
    await Patent.create({
      inventorId: String(faculty._id),
      inventorName: faculty.name,
      department: faculty.department,
      title: 'IoT-Enabled Automated Hydroponics Nutrient Management System',
      applicationNumber: '202541012345 A',
      filingDate: new Date('2025-04-15').toISOString(),
      status: 'Published',
      country: 'India',
      verificationStatus: 'IQAC_Approved',
      accreditationMapping: { naac: ['3.4.3'], nba: ['Criterion 5.5'], nirf: ['IPR'] }
    });

    // Grant
    await GrantAndProject.create({
      investigatorId: String(faculty._id),
      investigatorName: faculty.name,
      department: faculty.department,
      title: 'Modernization of Cloud Computing Laboratory for IoT Integrations',
      fundingAgency: 'AICTE - MODROBS',
      type: 'Research Grant',
      amountSanctioned: 1200000,
      durationYears: 2,
      startDate: new Date('2025-06-01').toISOString(),
      endDate: new Date('2027-06-01').toISOString(),
      status: 'Ongoing',
      verificationStatus: 'IQAC_Approved',
      accreditationMapping: { naac: ['3.1.1'], nba: ['Criterion 5.2'], nirf: ['FR'] }
    });

    // Student Achievement (Pending HOD)
    await StudentAchievement.create({
      studentId: String(student._id),
      studentName: student.name,
      department: student.department,
      academicYear: student.academicYear,
      type: 'Internship',
      title: 'Software Engineering Intern',
      organization: 'Zoho Corporation',
      details: 'Stipend: Rs. 20,000/month',
      dateOccurred: new Date('2026-01-10').toISOString(),
      attachments: [{ name: 'Offer Letter', url: '/uploads/sample-offer.pdf', version: 1 }],
      verificationStatus: 'Pending',
      accreditationMapping: { naac: ['1.3.4'], nba: ['Criterion 10.2'] }
    });

    console.log('✅ Demo database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  await connectDB();
  await seedDemoData();
  app.listen(PORT, () => {
    console.log(`🚀 FSAIS Server running on http://localhost:${PORT}`);
  });
};

startServer();
