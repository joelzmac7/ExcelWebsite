/**
 * Resume Parser Service
 * 
 * This service extracts structured information from resumes in various formats
 * including PDF, DOC, DOCX, and plain text.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const { NER } = require('@nlpjs/ner');
const ner = new NER({ threshold: 0.8 });

// Healthcare-specific entities and patterns
const HEALTHCARE_SPECIALTIES = [
  'ICU', 'Med/Surg', 'Emergency', 'ER', 'Labor & Delivery', 'L&D', 'OR', 
  'Operating Room', 'PACU', 'Post Anesthesia', 'Telemetry', 'Tele', 'Cath Lab',
  'Cardiac', 'Cardiology', 'Oncology', 'Pediatrics', 'Peds', 'NICU', 'PICU',
  'Psychiatric', 'Psych', 'Rehabilitation', 'Rehab', 'Home Health'
];

const CERTIFICATIONS = [
  'BLS', 'ACLS', 'PALS', 'NRP', 'TNCC', 'CCRN', 'CEN', 'CPEN', 'RNC', 
  'CNOR', 'CAPA', 'CPAN', 'OCN', 'CHPN', 'CFRN', 'CTRN', 'CCRN-K', 'CMSRN'
];

// Train NER with healthcare-specific entities
ner.addNamedEntityText('SPECIALTY', 'Healthcare Specialty', ['specialty', 'specialization', 'department'], HEALTHCARE_SPECIALTIES);
ner.addNamedEntityText('CERTIFICATION', 'Healthcare Certification', ['certification', 'certified', 'certificate'], CERTIFICATIONS);

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(filePath) {
  try {
    const { stdout } = await exec(`pdftotext -layout -nopgbrk "${filePath}" -`);
    return stdout;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from a DOC/DOCX file
 * @param {string} filePath - Path to the DOC/DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDOC(filePath) {
  try {
    const { stdout } = await exec(`antiword "${filePath}"`);
    return stdout;
  } catch (error) {
    try {
      // Try with catdoc if antiword fails
      const { stdout } = await exec(`catdoc "${filePath}"`);
      return stdout;
    } catch (err) {
      console.error('Error extracting text from DOC:', err);
      throw new Error('Failed to extract text from DOC');
    }
  }
}

/**
 * Extract text from a resume file
 * @param {string} filePath - Path to the resume file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromResume(filePath) {
  const fileExt = path.extname(filePath).toLowerCase();
  
  switch (fileExt) {
    case '.pdf':
      return extractTextFromPDF(filePath);
    case '.doc':
    case '.docx':
      return extractTextFromDOC(filePath);
    case '.txt':
      return fs.promises.readFile(filePath, 'utf8');
    default:
      throw new Error(`Unsupported file format: ${fileExt}`);
  }
}

/**
 * Extract contact information from text
 * @param {string} text - Resume text
 * @returns {Object} - Contact information
 */
function extractContactInfo(text) {
  const contactInfo = {
    name: null,
    email: null,
    phone: null
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    contactInfo.email = emailMatches[0];
  }

  // Extract phone number (various formats)
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    contactInfo.phone = phoneMatches[0];
  }

  // Extract name (assuming it's at the beginning of the resume)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    // Take the first non-empty line as the name (common resume format)
    const potentialName = lines[0].trim();
    // Verify it's not an email or phone number
    if (!emailRegex.test(potentialName) && !phoneRegex.test(potentialName)) {
      const nameParts = potentialName.split(' ');
      if (nameParts.length >= 2) {
        contactInfo.firstName = nameParts[0];
        contactInfo.lastName = nameParts.slice(1).join(' ');
      }
    }
  }

  return contactInfo;
}

/**
 * Extract education information from text
 * @param {string} text - Resume text
 * @returns {Array} - Education information
 */
function extractEducation(text) {
  const education = [];
  
  // Look for education section
  const educationRegex = /education|academic|degree|university|college|school/i;
  const lines = text.split('\n');
  
  let inEducationSection = false;
  let currentEducation = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.length === 0) continue;
    
    // Check if we're entering an education section
    if (educationRegex.test(line) && line.length < 30) {
      inEducationSection = true;
      continue;
    }
    
    // If we're in an education section, extract details
    if (inEducationSection) {
      // Check for degree
      if (/bachelor|master|associate|phd|doctor|bsn|msn|adn|diploma/i.test(line)) {
        if (Object.keys(currentEducation).length > 0) {
          education.push(currentEducation);
        }
        currentEducation = { degree: line };
      }
      
      // Check for dates
      const dateRegex = /(19|20)\d{2}\s*(-|to|–)\s*(19|20)\d{2}|present/i;
      if (dateRegex.test(line)) {
        currentEducation.dates = line.match(dateRegex)[0];
      }
      
      // Check if we're leaving the education section
      if (/experience|work|employment|skills|certification/i.test(line) && line.length < 30) {
        inEducationSection = false;
        if (Object.keys(currentEducation).length > 0) {
          education.push(currentEducation);
        }
        break;
      }
    }
  }
  
  // Add the last education entry if it exists
  if (inEducationSection && Object.keys(currentEducation).length > 0) {
    education.push(currentEducation);
  }
  
  return education;
}

/**
 * Extract experience information from text
 * @param {string} text - Resume text
 * @returns {Object} - Experience information
 */
function extractExperience(text) {
  const experience = {
    yearsOfExperience: null,
    positions: []
  };
  
  // Look for experience section
  const experienceRegex = /experience|work history|employment|professional background/i;
  const lines = text.split('\n');
  
  let inExperienceSection = false;
  let currentPosition = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.length === 0) continue;
    
    // Check if we're entering an experience section
    if (experienceRegex.test(line) && line.length < 50) {
      inExperienceSection = true;
      continue;
    }
    
    // If we're in an experience section, extract details
    if (inExperienceSection) {
      // Check for job title and employer
      if (/nurse|rn|lpn|cna|clinical|staff|travel|contract/i.test(line) && line.length < 100) {
        if (Object.keys(currentPosition).length > 0) {
          experience.positions.push(currentPosition);
        }
        currentPosition = { title: line };
      }
      
      // Check for dates
      const dateRegex = /(19|20)\d{2}\s*(-|to|–)\s*(19|20)\d{2}|present/i;
      if (dateRegex.test(line)) {
        currentPosition.dates = line.match(dateRegex)[0];
        
        // Try to calculate years of experience
        const dates = line.match(dateRegex)[0];
        const startYear = parseInt(dates.match(/(19|20)\d{2}/)[0]);
        let endYear;
        
        if (/present/i.test(dates)) {
          endYear = new Date().getFullYear();
        } else {
          const endYearMatch = dates.match(/(19|20)\d{2}/g);
          endYear = parseInt(endYearMatch[endYearMatch.length - 1]);
        }
        
        const years = endYear - startYear;
        if (!experience.yearsOfExperience || years > experience.yearsOfExperience) {
          experience.yearsOfExperience = years;
        }
      }
      
      // Check if we're leaving the experience section
      if (/education|skills|certification|references/i.test(line) && line.length < 30) {
        inExperienceSection = false;
        if (Object.keys(currentPosition).length > 0) {
          experience.positions.push(currentPosition);
        }
        break;
      }
    }
  }
  
  // Add the last position entry if it exists
  if (inExperienceSection && Object.keys(currentPosition).length > 0) {
    experience.positions.push(currentPosition);
  }
  
  // Map years of experience to the expected format
  if (experience.yearsOfExperience !== null) {
    if (experience.yearsOfExperience < 1) {
      experience.yearsOfExperienceCategory = '0-1';
    } else if (experience.yearsOfExperience <= 2) {
      experience.yearsOfExperienceCategory = '1-2';
    } else if (experience.yearsOfExperience <= 5) {
      experience.yearsOfExperienceCategory = '2-5';
    } else if (experience.yearsOfExperience <= 10) {
      experience.yearsOfExperienceCategory = '5-10';
    } else {
      experience.yearsOfExperienceCategory = '10+';
    }
  }
  
  return experience;
}

/**
 * Extract specialty information from text
 * @param {string} text - Resume text
 * @returns {string|null} - Specialty
 */
async function extractSpecialty(text) {
  // Use NER to find specialties
  const result = await ner.process({ locale: 'en', text });
  const specialties = result.entities.filter(entity => entity.entity === 'SPECIALTY');
  
  if (specialties.length > 0) {
    // Return the most frequently mentioned specialty
    const specialtyCounts = {};
    specialties.forEach(specialty => {
      const name = specialty.sourceText;
      specialtyCounts[name] = (specialtyCounts[name] || 0) + 1;
    });
    
    let maxCount = 0;
    let primarySpecialty = null;
    
    for (const [specialty, count] of Object.entries(specialtyCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primarySpecialty = specialty;
      }
    }
    
    // Map to standardized specialty names
    const specialtyMap = {
      'ICU': 'ICU',
      'MICU': 'ICU',
      'SICU': 'ICU',
      'Intensive Care': 'ICU',
      'Critical Care': 'ICU',
      'Med/Surg': 'Med/Surg',
      'Medical/Surgical': 'Med/Surg',
      'Medical Surgical': 'Med/Surg',
      'ER': 'Emergency',
      'ED': 'Emergency',
      'Emergency Department': 'Emergency',
      'Emergency Room': 'Emergency',
      'L&D': 'Labor & Delivery',
      'Labor and Delivery': 'Labor & Delivery',
      'Operating Room': 'OR',
      'Post Anesthesia': 'PACU',
      'Tele': 'Telemetry',
      'Cardiac': 'Telemetry',
      'Cardiology': 'Telemetry'
    };
    
    return specialtyMap[primarySpecialty] || primarySpecialty;
  }
  
  return null;
}

/**
 * Extract certifications from text
 * @param {string} text - Resume text
 * @returns {Array} - Certifications
 */
async function extractCertifications(text) {
  const certifications = [];
  
  // Use NER to find certifications
  const result = await ner.process({ locale: 'en', text });
  const certEntities = result.entities.filter(entity => entity.entity === 'CERTIFICATION');
  
  // Extract unique certifications
  const uniqueCerts = new Set();
  certEntities.forEach(cert => {
    uniqueCerts.add(cert.sourceText);
  });
  
  // Create certification objects
  uniqueCerts.forEach(certName => {
    certifications.push({
      name: certName,
      issuingOrganization: '', // This would require more complex extraction
      expirationDate: '' // This would require more complex extraction
    });
  });
  
  // Also look for common certification patterns
  const certRegex = /certified in|certification:|certifications:|certificate in/i;
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (certRegex.test(line)) {
      // Extract certification names from this line
      for (const cert of CERTIFICATIONS) {
        if (line.includes(cert) && !Array.from(uniqueCerts).includes(cert)) {
          certifications.push({
            name: cert,
            issuingOrganization: '',
            expirationDate: ''
          });
        }
      }
    }
  }
  
  return certifications;
}

/**
 * Extract licenses from text
 * @param {string} text - Resume text
 * @returns {Array} - Licenses
 */
function extractLicenses(text) {
  const licenses = [];
  const licenseRegex = /license|licensed|rn license|lpn license|nursing license/i;
  const stateRegex = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;
  const licenseNumberRegex = /\b[A-Z0-9]{5,15}\b/; // Generic pattern for license numbers
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (licenseRegex.test(line)) {
      const license = {};
      
      // Try to extract state
      const stateMatch = line.match(stateRegex);
      if (stateMatch) {
        license.state = stateMatch[0];
      }
      
      // Try to extract license number
      const licenseNumberMatch = line.match(licenseNumberRegex);
      if (licenseNumberMatch) {
        license.licenseNumber = licenseNumberMatch[0];
      }
      
      // Only add if we have at least one piece of information
      if (license.state || license.licenseNumber) {
        license.expirationDate = ''; // Would require more complex extraction
        licenses.push(license);
      }
    }
  }
  
  return licenses;
}

/**
 * Parse a resume file and extract structured information
 * @param {string} filePath - Path to the resume file
 * @returns {Promise<Object>} - Parsed resume data
 */
async function parseResume(filePath) {
  try {
    // Extract text from the resume
    const text = await extractTextFromResume(filePath);
    
    // Extract various components
    const contactInfo = extractContactInfo(text);
    const education = extractEducation(text);
    const experience = extractExperience(text);
    const specialty = await extractSpecialty(text);
    const certifications = await extractCertifications(text);
    const licenses = extractLicenses(text);
    
    // Combine all extracted information
    return {
      ...contactInfo,
      education,
      yearsExperience: experience.yearsOfExperienceCategory,
      positions: experience.positions,
      specialty,
      certifications,
      licenses
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
}

module.exports = {
  parseResume
};