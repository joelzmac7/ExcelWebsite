/**
 * Job Matching Algorithm
 * 
 * This service matches candidates to jobs based on skills, experience,
 * location, specialty, and certifications.
 */

/**
 * Calculate the match score between a candidate and a job
 * @param {Object} candidate - Candidate data from resume or application
 * @param {Object} job - Job data
 * @returns {Object} - Match score and details
 */
function calculateMatchScore(candidate, job) {
  // Initialize score components
  const scoreComponents = {
    specialty: 0,
    experience: 0,
    location: 0,
    certifications: 0,
    licenses: 0
  };
  
  // Maximum possible score for each component
  const maxScores = {
    specialty: 40,
    experience: 20,
    location: 15,
    certifications: 15,
    licenses: 10
  };
  
  // 1. Specialty matching (40%)
  if (candidate.specialty && job.specialty) {
    if (candidate.specialty.toLowerCase() === job.specialty.toLowerCase()) {
      scoreComponents.specialty = maxScores.specialty;
    } else {
      // Check for related specialties
      const relatedSpecialties = getRelatedSpecialties(job.specialty);
      if (relatedSpecialties.includes(candidate.specialty.toLowerCase())) {
        scoreComponents.specialty = maxScores.specialty * 0.7; // 70% score for related specialty
      }
    }
  }
  
  // 2. Experience matching (20%)
  if (candidate.yearsExperience && job.requiredExperience) {
    const candidateYears = parseExperienceRange(candidate.yearsExperience);
    const requiredYears = parseExperienceRange(job.requiredExperience);
    
    if (candidateYears.min >= requiredYears.min) {
      // Full score if candidate meets or exceeds minimum requirements
      scoreComponents.experience = maxScores.experience;
    } else if (candidateYears.max >= requiredYears.min) {
      // Partial score if candidate's max experience meets minimum requirements
      scoreComponents.experience = maxScores.experience * 0.7;
    } else {
      // Partial score based on how close they are to minimum requirements
      const ratio = candidateYears.max / requiredYears.min;
      scoreComponents.experience = maxScores.experience * Math.min(0.5, ratio);
    }
  }
  
  // 3. Location matching (15%)
  if (candidate.location && job.location) {
    if (candidate.location.state === job.location.state) {
      if (candidate.location.city === job.location.city) {
        // Same city and state
        scoreComponents.location = maxScores.location;
      } else {
        // Same state, different city
        scoreComponents.location = maxScores.location * 0.7;
      }
    } else if (candidate.preferredLocations && 
               candidate.preferredLocations.some(loc => 
                 loc.state === job.location.state || loc.city === job.location.city)) {
      // Job location is in candidate's preferred locations
      scoreComponents.location = maxScores.location * 0.8;
    } else {
      // Different state
      scoreComponents.location = 0;
    }
  }
  
  // 4. Certifications matching (15%)
  if (candidate.certifications && candidate.certifications.length > 0 && 
      job.requiredCertifications && job.requiredCertifications.length > 0) {
    
    const candidateCerts = candidate.certifications.map(cert => cert.name.toLowerCase());
    const requiredCerts = job.requiredCertifications.map(cert => cert.toLowerCase());
    
    let matchedCerts = 0;
    for (const cert of requiredCerts) {
      if (candidateCerts.includes(cert)) {
        matchedCerts++;
      }
    }
    
    const certRatio = requiredCerts.length > 0 ? matchedCerts / requiredCerts.length : 0;
    scoreComponents.certifications = maxScores.certifications * certRatio;
  } else if (!job.requiredCertifications || job.requiredCertifications.length === 0) {
    // No certifications required for the job
    scoreComponents.certifications = maxScores.certifications;
  }
  
  // 5. License matching (10%)
  if (candidate.licenses && candidate.licenses.length > 0 && 
      job.requiredLicenses && job.requiredLicenses.length > 0) {
    
    const candidateStates = candidate.licenses.map(license => license.state);
    
    // Check if candidate has license in the job's state
    if (job.location && candidateStates.includes(job.location.state)) {
      scoreComponents.licenses = maxScores.licenses;
    } else if (job.multiStateCompact && 
               candidateStates.some(state => isCompactState(state))) {
      // Candidate has a license in a compact state and job accepts compact licenses
      scoreComponents.licenses = maxScores.licenses * 0.8;
    } else {
      // No matching licenses
      scoreComponents.licenses = 0;
    }
  }
  
  // Calculate total score (weighted sum of components)
  const totalScore = Object.values(scoreComponents).reduce((sum, score) => sum + score, 0);
  const maxPossibleScore = Object.values(maxScores).reduce((sum, score) => sum + score, 0);
  const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
  
  return {
    score: percentageScore,
    components: scoreComponents,
    maxScores: maxScores
  };
}

/**
 * Parse experience range from string format
 * @param {string} experienceRange - Experience range (e.g., "0-1", "2-5", "10+")
 * @returns {Object} - Min and max years
 */
function parseExperienceRange(experienceRange) {
  if (!experienceRange) {
    return { min: 0, max: 0 };
  }
  
  if (experienceRange.endsWith('+')) {
    const min = parseInt(experienceRange.replace('+', ''));
    return { min, max: min + 5 }; // Assume 5 years beyond the minimum
  }
  
  const parts = experienceRange.split('-');
  if (parts.length === 2) {
    return {
      min: parseInt(parts[0]),
      max: parseInt(parts[1])
    };
  }
  
  // Default case
  return { min: 0, max: parseInt(experienceRange) || 0 };
}

/**
 * Get related specialties for a given specialty
 * @param {string} specialty - Primary specialty
 * @returns {Array} - Related specialties
 */
function getRelatedSpecialties(specialty) {
  const specialtyMap = {
    'ICU': ['critical care', 'micu', 'sicu', 'intensive care'],
    'Med/Surg': ['medical surgical', 'medical/surgical', 'med-surg'],
    'Emergency': ['er', 'ed', 'emergency room', 'emergency department', 'trauma'],
    'Labor & Delivery': ['l&d', 'labor and delivery', 'obstetrics', 'maternity'],
    'OR': ['operating room', 'surgery', 'surgical', 'perioperative'],
    'PACU': ['post anesthesia', 'recovery', 'post-op'],
    'Telemetry': ['tele', 'cardiac', 'cardiology', 'step-down'],
    'Cath Lab': ['cardiac cath', 'interventional cardiology'],
    'Oncology': ['cancer', 'hematology'],
    'Pediatrics': ['peds', 'children', 'nicu', 'picu'],
    'Psychiatric': ['psych', 'mental health', 'behavioral health'],
    'Rehabilitation': ['rehab', 'physical therapy', 'occupational therapy']
  };
  
  const normalizedSpecialty = specialty.toLowerCase();
  
  // Find the primary category for this specialty
  let primaryCategory = null;
  for (const [category, related] of Object.entries(specialtyMap)) {
    if (category.toLowerCase() === normalizedSpecialty || 
        related.includes(normalizedSpecialty)) {
      primaryCategory = category;
      break;
    }
  }
  
  // If we found a primary category, return all related specialties
  if (primaryCategory) {
    return [primaryCategory.toLowerCase(), ...specialtyMap[primaryCategory]];
  }
  
  // If no related specialties found, return empty array
  return [];
}

/**
 * Check if a state is part of the Nurse Licensure Compact
 * @param {string} state - State abbreviation
 * @returns {boolean} - Whether the state is part of the compact
 */
function isCompactState(state) {
  // List of states in the Nurse Licensure Compact as of 2023
  const compactStates = [
    'AL', 'AR', 'CO', 'DE', 'FL', 'GA', 'ID', 'IN', 'IA', 'KS', 'KY', 'LA', 
    'ME', 'MD', 'MS', 'MO', 'MT', 'NE', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OK', 
    'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'WV', 'WI', 'WY'
  ];
  
  return compactStates.includes(state.toUpperCase());
}

/**
 * Find matching jobs for a candidate
 * @param {Object} candidate - Candidate data
 * @param {Array} jobs - List of available jobs
 * @param {Object} options - Matching options
 * @returns {Array} - Sorted list of matching jobs with scores
 */
function findMatchingJobs(candidate, jobs, options = {}) {
  const {
    minimumScore = 50,
    limit = 10,
    includeScoreDetails = false
  } = options;
  
  // Calculate match scores for all jobs
  const matchedJobs = jobs.map(job => {
    const matchResult = calculateMatchScore(candidate, job);
    
    return {
      job,
      score: matchResult.score,
      ...(includeScoreDetails ? { scoreDetails: matchResult } : {})
    };
  });
  
  // Filter by minimum score and sort by score (descending)
  return matchedJobs
    .filter(match => match.score >= minimumScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find matching candidates for a job
 * @param {Object} job - Job data
 * @param {Array} candidates - List of candidates
 * @param {Object} options - Matching options
 * @returns {Array} - Sorted list of matching candidates with scores
 */
function findMatchingCandidates(job, candidates, options = {}) {
  const {
    minimumScore = 50,
    limit = 10,
    includeScoreDetails = false
  } = options;
  
  // Calculate match scores for all candidates
  const matchedCandidates = candidates.map(candidate => {
    const matchResult = calculateMatchScore(candidate, job);
    
    return {
      candidate,
      score: matchResult.score,
      ...(includeScoreDetails ? { scoreDetails: matchResult } : {})
    };
  });
  
  // Filter by minimum score and sort by score (descending)
  return matchedCandidates
    .filter(match => match.score >= minimumScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = {
  calculateMatchScore,
  findMatchingJobs,
  findMatchingCandidates
};