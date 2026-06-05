import { User } from '../models/User.js';
import { FacultyActivity } from '../models/FacultyActivity.js';
import { Publication } from '../models/Publication.js';
import { Patent } from '../models/Patent.js';
import { GrantAndProject } from '../models/GrantAndProject.js';
import { Event } from '../models/Event.js';

export const calculateAndSaveApiScore = async (facultyId) => {
  try {
    let score = 0;

    // 1. Faculty Development Activities (Must be IQAC_Approved)
    const activities = await FacultyActivity.find({ 
      facultyId, 
      verificationStatus: 'IQAC_Approved' 
    });
    for (const act of activities) {
      if (act.type === 'FDP') {
        score += act.duration >= 5 ? 10 : 5;
      } else if (act.type === 'STTP') {
        score += 10;
      } else if (act.type === 'Workshop' || act.type === 'Online Course') {
        score += 5;
      } else if (act.type === 'Resource Person') {
        score += 15;
      }
    }

    // 2. Journal & Conference Publications
    const publications = await Publication.find({ 
      authorId: facultyId, 
      verificationStatus: 'IQAC_Approved' 
    });
    for (const pub of publications) {
      if (pub.type === 'Journal') {
        score += 15 + (pub.impactFactor ? Math.round(pub.impactFactor * 2) : 0);
      } else if (pub.type === 'Conference') {
        score += 8;
      } else if (pub.type === 'Book') {
        score += 20;
      } else if (pub.type === 'Book Chapter') {
        score += 10;
      }
    }

    // 3. Patents
    const patents = await Patent.find({ 
      inventorId: facultyId, 
      verificationStatus: 'IQAC_Approved' 
    });
    for (const pat of patents) {
      if (pat.status === 'Granted') {
        score += 30;
      } else if (pat.status === 'Published') {
        score += 15;
      } else if (pat.status === 'Filed') {
        score += 5;
      }
    }

    // 4. Research Grants & Consultancy Projects
    const grants = await GrantAndProject.find({ 
      investigatorId: facultyId, 
      verificationStatus: 'IQAC_Approved' 
    });
    for (const grant of grants) {
      if (grant.type === 'Research Grant') {
        score += 20 + Math.floor(grant.amountSanctioned / 100000); // 1 extra point per Lakh
      } else if (grant.type === 'Consultancy') {
        score += 15 + Math.floor(grant.amountSanctioned / 50000); // 1 extra point per 50k
      } else if (grant.type === 'Seed Money') {
        score += 10;
      }
    }

    // 5. Events Organized
    const events = await Event.find({ 
      organizerId: facultyId, 
      verificationStatus: 'IQAC_Approved' 
    });
    for (const ev of events) {
      if (ev.type === 'Conference' || ev.type === 'Symposium') {
        score += 15;
      } else if (ev.type === 'Hackathon' || ev.type === 'Project Expo') {
        score += 10;
      } else {
        score += 5; // Workshops, guest lectures, special days
      }
    }

    // Save calculation to User model
    await User.findByIdAndUpdate(facultyId, { apiScore: score });
    return score;
  } catch (err) {
    console.error(`Error calculating API Score for ${facultyId}:`, err);
    return 0;
  }
};
