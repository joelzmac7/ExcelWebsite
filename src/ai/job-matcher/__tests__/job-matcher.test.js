/**
 * Unit tests for the job matching algorithm
 */
const { 
  calculateMatchScore, 
  findMatchingJobs, 
  findMatchingCandidates 
} = require('../index');

describe('Job Matcher', () => {
  // Test data
  const candidate = {
    specialty: 'ICU',
    yearsExperience: '5-10',
    location: {
      city: 'San Francisco',
      state: 'CA',
      willingToRelocate: true
    },
    certifications: [
      { name: 'BLS', issuingOrganization: 'AHA', expirationDate: '2024-06-30' },
      { name: 'ACLS', issuingOrganization: 'AHA', expirationDate: '2024-06-30' },
      { name: 'PALS', issuingOrganization: 'AHA', expirationDate: '2024-06-30' }
    ],
    licenses: [
      { state: 'CA', licenseNumber: '12345', expirationDate: '2025-12-31' },
      { state: 'NY', licenseNumber: '67890', expirationDate: '2025-12-31' }
    ]
  };

  const jobs = [
    {
      id: '1',
      title: 'ICU Nurse',
      specialty: 'ICU',
      requiredExperience: '2-5',
      location: {
        city: 'San Francisco',
        state: 'CA'
      },
      requiredCertifications: ['BLS', 'ACLS'],
      state: 'CA'
    },
    {
      id: '2',
      title: 'ER Nurse',
      specialty: 'Emergency',
      requiredExperience: '5-10',
      location: {
        city: 'Los Angeles',
        state: 'CA'
      },
      requiredCertifications: ['BLS', 'ACLS', 'PALS'],
      state: 'CA'
    },
    {
      id: '3',
      title: 'PICU Nurse',
      specialty: 'Pediatrics',
      requiredExperience: '10+',
      location: {
        city: 'New York',
        state: 'NY'
      },
      requiredCertifications: ['BLS', 'PALS'],
      state: 'NY'
    }
  ];

  describe('calculateMatchScore', () => {
    test('should calculate perfect match score for exact match', () => {
      const job = jobs[0]; // ICU job in San Francisco, CA
      const result = calculateMatchScore(candidate, job);
      
      // Should be a high match score
      expect(result.matchPercentage).toBeGreaterThanOrEqual(90);
      expect(result.isStrongMatch).toBe(true);
      
      // Check individual score components
      expect(result.scores.specialty).toBe(30); // Perfect specialty match
      expect(result.scores.experience).toBe(25); // Exceeds required experience
      expect(result.scores.location).toBe(20); // Same city and state
      expect(result.scores.certifications).toBe(15); // Has all required certifications
      expect(result.scores.licenses).toBe(10); // Has license for job state
    });

    test('should calculate partial match score for related specialty', () => {
      const job = jobs[1]; // ER job in Los Angeles, CA
      const result = calculateMatchScore(candidate, job);
      
      // Should be a moderate match score
      expect(result.matchPercentage).toBeGreaterThanOrEqual(60);
      expect(result.matchPercentage).toBeLessThan(90);
      
      // Check individual score components
      expect(result.scores.specialty).toBeLessThan(30); // Not exact specialty match
      expect(result.scores.experience).toBe(25); // Meets required experience
      expect(result.scores.location).toBeLessThan(20); // Same state, different city
      expect(result.scores.certifications).toBe(15); // Has all required certifications
      expect(result.scores.licenses).toBe(10); // Has license for job state
    });

    test('should calculate low match score for mismatched specialty and location', () => {
      // Create a job with mismatched specialty and location
      const job = {
        id: '4',
        title: 'Labor & Delivery Nurse',
        specialty: 'Labor & Delivery',
        requiredExperience: '5-10',
        location: {
          city: 'Miami',
          state: 'FL'
        },
        requiredCertifications: ['BLS', 'NRP'],
        state: 'FL'
      };
      
      const result = calculateMatchScore(candidate, job);
      
      // Should be a low match score
      expect(result.matchPercentage).toBeLessThan(60);
      expect(result.isStrongMatch).toBe(false);
      
      // Check individual score components
      expect(result.scores.specialty).toBe(0); // No specialty match
      expect(result.scores.experience).toBe(25); // Meets required experience
      expect(result.scores.location).toBe(0); // Different state and city
      expect(result.scores.certifications).toBeLessThan(15); // Missing some required certifications
      expect(result.scores.licenses).toBe(0); // No license for job state
    });
  });

  describe('findMatchingJobs', () => {
    test('should find and rank matching jobs for a candidate', () => {
      const options = {
        minMatchPercentage: 50,
        includeScores: true
      };
      
      const matches = findMatchingJobs(candidate, jobs, options);
      
      // Should return matches in descending order of match percentage
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchPercentage).toBeGreaterThanOrEqual(matches[1]?.matchPercentage || 0);
      
      // First match should be the ICU job
      expect(matches[0].job.id).toBe('1');
      expect(matches[0].isStrongMatch).toBe(true);
      
      // Should include score details
      expect(matches[0].scores).toBeDefined();
    });

    test('should filter jobs below minimum match percentage', () => {
      const options = {
        minMatchPercentage: 80,
        limit: 10
      };
      
      const matches = findMatchingJobs(candidate, jobs, options);
      
      // Should only include jobs with match percentage >= 80
      expect(matches.every(match => match.matchPercentage >= 80)).toBe(true);
      
      // Should only include the ICU job
      expect(matches.length).toBe(1);
      expect(matches[0].job.id).toBe('1');
    });

    test('should limit number of results', () => {
      const options = {
        minMatchPercentage: 0, // Include all jobs
        limit: 2
      };
      
      const matches = findMatchingJobs(candidate, jobs, options);
      
      // Should only return 2 jobs
      expect(matches.length).toBe(2);
    });
  });

  describe('findMatchingCandidates', () => {
    test('should find and rank matching candidates for a job', () => {
      const job = jobs[0]; // ICU job
      
      const candidates = [
        {
          id: '1',
          ...candidate // ICU nurse
        },
        {
          id: '2',
          specialty: 'Emergency',
          yearsExperience: '2-5',
          location: {
            city: 'San Francisco',
            state: 'CA',
            willingToRelocate: false
          },
          certifications: [
            { name: 'BLS', issuingOrganization: 'AHA' },
            { name: 'ACLS', issuingOrganization: 'AHA' }
          ],
          licenses: [
            { state: 'CA', licenseNumber: '54321' }
          ]
        },
        {
          id: '3',
          specialty: 'Med/Surg',
          yearsExperience: '0-1',
          location: {
            city: 'Chicago',
            state: 'IL',
            willingToRelocate: true
          },
          certifications: [
            { name: 'BLS', issuingOrganization: 'AHA' }
          ],
          licenses: [
            { state: 'IL', licenseNumber: '13579' }
          ]
        }
      ];
      
      const options = {
        minMatchPercentage: 50,
        includeScores: true
      };
      
      const matches = findMatchingCandidates(job, candidates, options);
      
      // Should return matches in descending order of match percentage
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchPercentage).toBeGreaterThanOrEqual(matches[1]?.matchPercentage || 0);
      
      // First match should be the ICU nurse
      expect(matches[0].candidate.id).toBe('1');
      expect(matches[0].isStrongMatch).toBe(true);
      
      // Should include score details
      expect(matches[0].scores).toBeDefined();
    });
  });
});