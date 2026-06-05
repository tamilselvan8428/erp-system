export const mapActivityToAccreditation = (moduleType, subType) => {
  const mapping = {
    naac: [],
    nba: [],
    nirf: [],
    aicte: [],
    ariia: []
  };

  if (moduleType === 'FacultyActivity') {
    if (subType === 'FDP' || subType === 'STTP') {
      mapping.naac = ['6.3.3'];
      mapping.nba = ['Criterion 5.7'];
      mapping.nirf = ['FSPD'];
      mapping.aicte = ['FDP-STTP'];
    } else if (subType === 'Workshop') {
      mapping.naac = ['3.3.2'];
      mapping.nba = ['Criterion 8'];
    } else if (subType === 'Online Course') {
      mapping.naac = ['6.3.3'];
      mapping.nba = ['Criterion 5.7'];
    } else if (subType === 'Resource Person') {
      mapping.naac = ['3.1.3'];
    }
  } else if (moduleType === 'Publication') {
    if (subType === 'Journal') {
      mapping.naac = ['3.4.5'];
      mapping.nba = ['Criterion 5.4'];
      mapping.nirf = ['PU'];
    } else {
      mapping.naac = ['3.4.6'];
      mapping.nba = ['Criterion 5.4'];
    }
  } else if (moduleType === 'Patent') {
    mapping.naac = ['3.4.3'];
    mapping.nba = ['Criterion 5.5'];
    mapping.nirf = ['IPR'];
    mapping.ariia = ['KI-4'];
  } else if (moduleType === 'GrantAndProject') {
    if (subType === 'Research Grant') {
      mapping.naac = ['3.1.1'];
      mapping.nba = ['Criterion 5.2'];
      mapping.nirf = ['FR'];
    } else if (subType === 'Consultancy') {
      mapping.naac = ['3.5.1'];
      mapping.nba = ['Criterion 5.3'];
      mapping.nirf = ['PCS'];
      mapping.ariia = ['KI-5'];
    } else if (subType === 'Seed Money') {
      mapping.naac = ['3.1.2'];
    }
  } else if (moduleType === 'Event') {
    mapping.naac = ['3.3.2'];
    mapping.nba = ['Criterion 8'];
    if (subType === 'Hackathon' || subType === 'Project Expo') {
      mapping.ariia = ['KI-2'];
    }
  } else if (moduleType === 'StudentAchievement') {
    if (subType === 'Internship') {
      mapping.naac = ['1.3.4'];
      mapping.nba = ['Criterion 10.2'];
      mapping.nirf = ['GPH'];
    } else if (subType === 'Placement Offer') {
      mapping.naac = ['5.2.1'];
      mapping.nba = ['Criterion 4.4'];
      mapping.nirf = ['GP'];
    } else if (subType === 'Higher Studies') {
      mapping.naac = ['5.2.2'];
      mapping.nirf = ['GHS'];
    } else if (subType === 'NPTEL Certification') {
      mapping.naac = ['1.2.2'];
      mapping.nba = ['Criterion 8.2'];
    }
  }

  return mapping;
};
